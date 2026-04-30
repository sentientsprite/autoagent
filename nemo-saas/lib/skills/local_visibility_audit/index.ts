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

import { gbpInsights, napInsights, type Insight } from "@/lib/skills/_shared/rule-engine";
import { narrative, type Usage } from "@/lib/skills/_shared/llm";
import { findPlace, placeToGbpProfile, fetchNapRecords } from "@/lib/connectors/places";
import { renderPlaybook } from "@/lib/skills/_shared/playbook";
import type { Site } from "@/lib/db/types";

// =============================================================================
// schemas
// =============================================================================

export const Input = z.object({
  businessName: z.string().min(2),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/),
  city: z.string().optional(),
  region: z.string().optional(),
  websiteUrl: z.string().url().optional(),
  /** From the Site row when running for an authed customer. */
  expectedServiceAreaZipCount: z.number().int().min(0).default(1),
  /** When known (paid tier), pass real review velocity; the wedge estimates. */
  reviewsLast90d: z.number().int().optional(),
});
export type Input = z.infer<typeof Input>;

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
    placeId: z.string().optional(),
    rating: z.number().optional(),
    reviewCount: z.number().optional(),
    photoCount: z.number().optional(),
    napDirectoriesChecked: z.number().int(),
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
  });

  const napRecords = await fetchNapRecords({
    businessName: parsed.businessName,
    zip: parsed.zip,
    city: parsed.city,
    region: parsed.region,
  });

  const insights: Insight[] = [];

  if (place) {
    const gbp = placeToGbpProfile(place, parsed.expectedServiceAreaZipCount, parsed.reviewsLast90d);
    insights.push(...gbpInsights(gbp));

    if (parsed.websiteUrl) {
      insights.push(...napInsights({
        truth: {
          name: parsed.businessName,
          address: place.formattedAddress,
          phone: place.phone ?? "",
        },
        records: napRecords,
      }));
    }
  } else {
    insights.push({
      id: "gbp.not_found",
      severity: "critical",
      title: "We couldn't find your Google Business Profile",
      message: `No Google listing matched "${parsed.businessName}" near ${parsed.zip}.`,
      action: "Claim your free GBP at business.google.com — this is the #1 lead source for home services.",
    });
  }

  const score = scoreFromInsights(insights);
  return GradedOutput.parse({
    grade: gradeFromScore(score),
    score,
    insights,
    evidence: {
      placeFound: !!place,
      placeId: place?.placeId,
      rating: place?.rating,
      reviewCount: place?.userRatingsTotal,
      photoCount: place?.photoCount,
      napDirectoriesChecked: napRecords.length,
    },
  });
}

// =============================================================================
// runNarrative — LLM call, uses per-tenant playbook
// =============================================================================

export async function runNarrative(args: {
  deterministic: DeterministicOutput;
  site?: Site;
  /** Override playbook (e.g. for the wedge with no Site row yet). */
  playbookOverride?: string;
}): Promise<{ value: NarrativeOutput; usage: Usage }> {
  const playbook = args.playbookOverride
    ?? (args.site
      ? renderPlaybook(args.site)
      : renderPlaybook(SYNTHETIC_WEDGE_SITE));

  return narrative({
    playbook,
    structured: args.deterministic,
    schema: NarrativeOutput,
    task:
      "Write the headline + 1-paragraph summary + top 3 prioritized fixes for this " +
      "Local Visibility audit. Each fix MUST cite an insight id from the structured " +
      "input. Do not invent insights. Frame fixes in dollars-and-jobs terms.",
  });
}

// =============================================================================
// run — convenience wrapper used by the wedge endpoint
// =============================================================================

export async function run(input: Input, opts: { withNarrative?: boolean; site?: Site } = {}): Promise<SkillResult> {
  const deterministic = await runDeterministic(input);
  if (!opts.withNarrative) return { deterministic };
  const n = await runNarrative({ deterministic, site: opts.site });
  return { deterministic, narrative: n.value, llmUsage: n.usage };
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
