/**
 * Skill: local_visibility_audit
 *
 * The wedge skill. Powers both the unauthenticated public LVS landing page
 * (free) and the recurring paid weekly audit job.
 *
 * Deterministic step (always runs):
 *   - Lookup business via Google Places (or fixture)
 *   - Build GbpProfile, NapRecords
 *   - Run rule engine -> Insight[]
 *   - Compute letter grade A..F
 *
 * Narrative step (optional, paid tier or wedge upgrade):
 *   - Generate plain-English summary + top-3 prioritized fixes
 *   - Use per-tenant playbook as system prompt
 *
 * Verifier hooks:
 *   - Output JSON includes every fired rule id under `insights[].id`
 *   - tasks/local_visibility_audit/* fixtures assert specific ids fire
 */
import { z } from "zod";

import {
  gbpInsights,
  napInsights,
  localPresenceInsights,
  schemaInsights,
  type Insight,
} from "@/lib/skills/_shared/rule-engine";
import { snapshot, summarizeOnPage } from "@/lib/crawler/client";
import { narrative, type Usage } from "@/lib/skills/_shared/llm";
import {
  GEO_GBP_ACTIVITY_NARRATIVE_TASK,
  GEO_GBP_PLAYBOOK_ADDENDUM,
} from "@/lib/skills/local_visibility_audit/geo-gbp-narrative";
import {
  findPlace,
  placeToGbpProfile,
  fetchNapRecords,
  isPlacesConfigured,
  scanLocalPresence,
  LOCAL_RADIUS_MI,
} from "@/lib/connectors/places";
import { keywordPresenceInsights } from "@/lib/keywords/crm-importer";
import { renderBusinessContext, renderPlaybook } from "@/lib/skills/_shared/playbook";
import type { Site } from "@/lib/db/types";

// =============================================================================
// schemas
// =============================================================================

export const Input = z
  .object({
    businessName: z.string().min(2),
    /** Primary geo for Places — city name (Google local is city-shaped). */
    city: z.string().min(2).optional(),
    region: z.string().optional(),
    /** Optional legacy; not used for Places ranking. */
    zip: z.string().optional(),
    websiteUrl: z.string().url().optional(),
    googleMapsUrl: z.string().url().optional(),
    expectedServiceAreaZipCount: z.number().int().min(0).default(0),
    reviewsLast90d: z.number().int().optional(),
    /** Phase 2 — phrases from page keyword strategy Export sheet. */
    targetKeywords: z
      .array(
        z.object({
          phrase: z.string().min(2),
          topic: z.string().optional(),
          landingUrl: z.string().url().optional(),
        }),
      )
      .max(60)
      .optional(),
  })
  .refine((d) => Boolean(d.city?.trim() || d.zip?.trim()), {
    message: "city is required (ZIP alone is not enough for Google local)",
    path: ["city"],
  });
// Use z.input so callers can omit fields that have .default() — runtime
// Input.parse() fills them in. z.infer/z.output is for what the parser returns.
export type Input = z.input<typeof Input>;

const GradedOutput = z.object({
  grade: z.enum(["A", "B", "C", "D", "F"]),
  score: z.number().min(0).max(100),
  insights: z.array(z.object({
    id: z.string(),
    severity: z.enum(["critical", "warning", "info", "win"]),
    title: z.string(),
    message: z.string(),
    action: z.string(),
    evidence: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  })),
  evidence: z.object({
    placeFound: z.boolean(),
    /** False when GOOGLE_MAPS_API_KEY is unset — we never called Google. */
    placesLookupConfigured: z.boolean(),
    placeId: z.string().optional(),
    rating: z.number().optional(),
    reviewCount: z.number().optional(),
    photoCount: z.number().optional(),
    napDirectoriesChecked: z.number().int(),
    /** City-radius local market scan (25mi). */
    localRadiusMi: z.number().optional(),
    localCity: z.string().optional(),
    distanceFromCityMi: z.number().optional(),
    withinLocalRadius: z.boolean().optional(),
    localCompetitorCount: z.number().int().optional(),
  }),
});
export type DeterministicOutput = z.infer<typeof GradedOutput>;

const NarrativeOutput = z.object({
  headline: z.string(),
  summary: z.string(),
  topFixes: z.array(z.object({
    insightId: z.string(),
    title: z.string(),
    why: z.string(),
    do_this: z.string(),
  })).max(3),
});
export type NarrativeOutput = z.infer<typeof NarrativeOutput>;

export interface SkillResult {
  deterministic: DeterministicOutput;
  narrative?: NarrativeOutput;
  llmUsage?: Usage;
}

// =============================================================================
// runDeterministic — pure, no LLM, no auth
// =============================================================================

export async function runDeterministic(input: Input): Promise<DeterministicOutput> {
  const parsed = Input.parse(input);

  const place = await findPlace({
    businessName: parsed.businessName,
    zip: parsed.zip,
    city: parsed.city,
    region: parsed.region,
    websiteUrl: parsed.websiteUrl,
    googleMapsUrl: parsed.googleMapsUrl,
  });

  const napRecords = await fetchNapRecords({
    businessName: parsed.businessName,
    zip: parsed.zip,
    city: parsed.city,
    region: parsed.region,
    websiteUrl: parsed.websiteUrl,
  });

  const insights: Insight[] = [];
  let localScan: Awaited<ReturnType<typeof scanLocalPresence>> | null = null;

  if (place) {
    const gbp = placeToGbpProfile(place, parsed.expectedServiceAreaZipCount, parsed.reviewsLast90d);
    insights.push(...gbpInsights(gbp));

    if (parsed.city?.trim()) {
      localScan = await scanLocalPresence(place, {
        businessName: parsed.businessName,
        city: parsed.city,
        region: parsed.region,
        websiteUrl: parsed.websiteUrl,
      });
      insights.push(
        ...localPresenceInsights({
          city: localScan.city,
          region: localScan.region,
          radiusMi: localScan.radiusMi,
          distanceFromCityMi: localScan.distanceFromCityMi,
          withinRadius: localScan.withinRadius,
          competitorCount: localScan.competitorCount,
          listingRating: place.rating ?? 0,
          listingReviews: place.userRatingsTotal ?? 0,
          medianCompetitorRating: localScan.medianCompetitorRating,
          medianCompetitorReviews: localScan.medianCompetitorReviews,
          primaryCategory: place.primaryCategory,
        }),
      );
    }

    if (parsed.websiteUrl) {
      insights.push(...napInsights({
        truth: {
          name: parsed.businessName,
          address: place.formattedAddress,
          phone: place.phone ?? "",
        },
        records: napRecords,
      }));

      // GEO adjacency: LocalBusiness JSON-LD on the site (NAP must still match GBP).
      try {
        const snap = await snapshot(parsed.websiteUrl);
        if (snap.status < 400 && snap.html) {
          const onPage = summarizeOnPage(snap.html, snap.finalUrl || parsed.websiteUrl);
          insights.push(
            ...schemaInsights({
              hasSchemaLocalBusiness: onPage.hasSchemaLocalBusiness,
              websiteUrl: parsed.websiteUrl,
            }),
          );
          // Phase 2 — on-page keyword presence vs CRM import (reuse fetch).
          if (parsed.targetKeywords?.length) {
            const text = snap.html
              .replace(/<script[\s\S]*?<\/script>/gi, " ")
              .replace(/<style[\s\S]*?<\/style>/gi, " ")
              .replace(/<[^>]+>/g, " ");
            insights.push(...keywordPresenceInsights(text, parsed.targetKeywords));
          }
        } else if (parsed.targetKeywords?.length) {
          insights.push({
            id: "kw.site_fetch_failed",
            severity: "info",
            title: "Could not fetch site for keyword check",
            message: "Phase-2 keyword presence skipped — site fetch returned an error status.",
            action: "Re-run with a reachable website URL, or paste CRM phrases after deploy.",
          });
        }
      } catch {
        if (parsed.targetKeywords?.length) {
          insights.push({
            id: "kw.site_fetch_failed",
            severity: "info",
            title: "Could not fetch site for keyword check",
            message: "Phase-2 keyword presence skipped — site fetch timed out or failed.",
            action: "Re-run with a reachable website URL, or paste CRM phrases after deploy.",
          });
        }
      }
    }
  } else if (!isPlacesConfigured()) {
    insights.push({
      id: "gbp.lookup_unavailable",
      severity: "info",
      title: "Google Business Profile lookup isn’t configured yet",
      message:
        "This free audit couldn’t call Google Places (API key not set on the server), so we didn’t search for your listing. This is not a finding that your GBP is missing.",
      action:
        "Re-run after Google Places is enabled, or claim/verify your profile at business.google.com if you don’t have one yet.",
    });
  } else {
    const hint = parsed.websiteUrl
      ? ` We had website ${parsed.websiteUrl} — if the Maps listing uses a shorter name, try that name or paste the Google Maps link on a re-run.`
      : "";
    insights.push({
      id: "gbp.not_found",
      severity: "critical",
      title: "We couldn't find your Google Business Profile",
      message: `No Google listing matched "${parsed.businessName}" in ${parsed.city}${parsed.region ? `, ${parsed.region}` : ""}.${hint}`,
      action:
        "Confirm the exact Maps listing name + city (and state). If the profile exists, re-run with the website URL — we rank Places hits by site host.",
    });
  }

  const score = scoreFromInsights(insights);
  return GradedOutput.parse({
    grade: gradeFromScore(score),
    score,
    insights,
    evidence: {
      placeFound: !!place,
      placesLookupConfigured: isPlacesConfigured(),
      placeId: place?.placeId,
      rating: place?.rating,
      reviewCount: place?.userRatingsTotal,
      photoCount: place?.photoCount,
      napDirectoriesChecked: napRecords.length,
      localRadiusMi: LOCAL_RADIUS_MI,
      localCity: localScan?.city ?? parsed.city,
      distanceFromCityMi: localScan?.distanceFromCityMi ?? undefined,
      withinLocalRadius: localScan?.withinRadius ?? undefined,
      localCompetitorCount: localScan?.competitorCount,
    },
  });
}

// =============================================================================
// runNarrative — LLM call, uses per-tenant playbook
// =============================================================================

export async function runNarrative(args: {
  deterministic: DeterministicOutput;
  site?: Site;
  /** Canonical per-site CLIENT.md loaded by the workflow before the run. */
  clientMd?: string | null;
  /** Override playbook (e.g. for the wedge with no Site row yet). */
  playbookOverride?: string;
}): Promise<{ value: NarrativeOutput; usage: Usage }> {
  const playbook = args.playbookOverride
    ?? (args.site
      ? renderBusinessContext(args.site, { clientMd: args.clientMd })
      : renderPlaybook(SYNTHETIC_WEDGE_SITE));

  const playbookWithGeo = `${playbook.trim()}\n\n${GEO_GBP_PLAYBOOK_ADDENDUM}`;

  return narrative({
    playbook: playbookWithGeo,
    structured: args.deterministic,
    schema: NarrativeOutput,
    task: GEO_GBP_ACTIVITY_NARRATIVE_TASK,
  });
}

// =============================================================================
// run — convenience wrapper used by the wedge endpoint
// =============================================================================

function narrativeApiConfigured(): boolean {
  const model = process.env.NEMO_NARRATIVE_MODEL ?? "gpt-4o-mini";
  if (model.startsWith("claude")) {
    return Boolean(process.env.ANTHROPIC_API_KEY?.trim());
  }
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export async function run(
  input: Input,
  opts: { withNarrative?: boolean; site?: Site; clientMd?: string | null } = {},
): Promise<SkillResult> {
  const deterministic = await runDeterministic(input);
  if (!opts.withNarrative) return { deterministic };

  if (!narrativeApiConfigured()) {
    console.warn(
      "local_visibility_audit: skipping narrative (set OPENAI_API_KEY or ANTHROPIC_API_KEY + matching NEMO_NARRATIVE_MODEL)",
    );
    return { deterministic };
  }

  try {
    const n = await runNarrative({ deterministic, site: opts.site, clientMd: opts.clientMd });
    return { deterministic, narrative: n.value, llmUsage: n.usage };
  } catch (e) {
    console.error("local_visibility_audit: narrative failed; returning deterministic-only", e);
    return { deterministic };
  }
}

// =============================================================================
// scoring + helpers
// =============================================================================

const SEVERITY_WEIGHT: Record<Insight["severity"], number> = {
  critical: 25,
  warning: 10,
  info: 3,
  win: -5,        // a win pushes you up the curve
};

function scoreFromInsights(insights: Insight[]): number {
  const penalty = insights.reduce((s, i) => s + SEVERITY_WEIGHT[i.severity], 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}

function gradeFromScore(score: number): DeterministicOutput["grade"] {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 65) return "C";
  if (score >= 50) return "D";
  return "F";
}

const SYNTHETIC_WEDGE_SITE: Site = {
  id: "wedge",
  org_id: "wedge",
  name: "Wedge audit",
  website_url: null,
  business_name: "Your business",
  street_address: null,
  city: null,
  region: null,
  postal_code: null,
  country: "US",
  phone: null,
  primary_category: null,
  service_area_zips: null,
  playbook_md: null,
  created_at: "",
  updated_at: "",
};
