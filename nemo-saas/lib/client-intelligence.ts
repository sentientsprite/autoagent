import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ClientIntelligenceFile,
  ClientIntelligenceEvent,
  Job,
  Site,
  WeeklyClientBrief,
} from "@/lib/db/types";
import {
  applyBaselineStatusesToClientMd,
  phase3StatusesFromLvsInsights,
  renderSeoGeoBaselineSection,
  upsertSeoGeoBaselineSection,
  type BaselineStatus,
} from "@/lib/seo-geo-baseline";

export const CLIENT_INTELLIGENCE_SECTIONS = [
  "who_they_are",
  "works",
  "hypotheses",
  "changes",
  "questions",
  "seo_baseline",
] as const;

export type ClientIntelligenceSection = (typeof CLIENT_INTELLIGENCE_SECTIONS)[number];

export function renderStarterClientMd(site: Site, opts: { goals?: string[]; constraints?: string[] } = {}): string {
  const serviceAreas = site.service_area_zips?.length
    ? site.service_area_zips.join(", ")
    : "Open question: confirm real service areas.";

  const goals = opts.goals?.length ? opts.goals.map((g) => `- ${g}`).join("\n") : "- Open question: confirm owner goals.";
  const constraints = opts.constraints?.length
    ? opts.constraints.map((c) => `- ${c}`).join("\n")
    : "- Open question: confirm budget, seasonality, and approval preferences.";

  const baseline = renderSeoGeoBaselineSection({ primaryCategory: site.primary_category });

  return `# ${site.business_name ?? site.name} Intelligence File

## Who They Are
- Business: ${site.business_name ?? site.name}
- Category: ${site.primary_category ?? "Open question: confirm primary category."}
- Website: ${site.website_url ?? "Open question: confirm website."}
- Phone: ${site.phone ?? "Open question: confirm phone."}
- Location: ${[site.city, site.region, site.postal_code].filter(Boolean).join(", ") || "Open question: confirm location."}
- Service areas: ${serviceAreas}

## What We Know Works
- Open question: capture messaging that reviewers and callers respond to.
- Open question: identify strongest offer and seasonality.

## Current Beliefs We're Testing
${goals}

## What Changed
- Starter file generated at onboarding.
- SEO/GEO baseline seeded from home-services playbook (Phases 1–4).

${baseline}
## Open Questions
${constraints}
`;
}

/**
 * Ensure an existing CLIENT.md has the SEO/GEO baseline section (idempotent upsert).
 * Used when upgrading sites onboarded before the playbook was wired.
 */
export function ensureSeoGeoBaselineInClientMd(
  clientMd: string,
  site: Pick<Site, "primary_category">,
): string {
  if (clientMd.includes("## SEO/GEO Baseline (2026)")) return clientMd;
  return upsertSeoGeoBaselineSection(
    clientMd,
    renderSeoGeoBaselineSection({ primaryCategory: site.primary_category }),
  );
}

/**
 * Patch Phase 3 checklist statuses from a Local Visibility audit insight id list.
 */
export function applyLvsInsightsToClientMd(
  clientMd: string,
  insightIds: string[],
): { clientMd: string; statuses: Partial<Record<string, BaselineStatus>> } {
  const withSection = clientMd.includes("## SEO/GEO Baseline (2026)")
    ? clientMd
    : clientMd; // caller should ensure section; apply is no-op-safe on missing ids
  const statuses = phase3StatusesFromLvsInsights(insightIds);
  return {
    clientMd: applyBaselineStatusesToClientMd(withSection, statuses),
    statuses,
  };
}

export async function ensureClientIntelligenceFile(
  db: SupabaseClient,
  site: Site,
  opts: { goals?: string[]; constraints?: string[]; actor?: string } = {},
): Promise<ClientIntelligenceFile> {
  const existing = await getClientIntelligenceFile(db, site.id);
  if (existing) {
    const upgraded = ensureSeoGeoBaselineInClientMd(existing.client_md, site);
    if (upgraded !== existing.client_md) {
      const { data, error } = await db
        .from("client_intelligence_files")
        .update({
          client_md: upgraded,
          version: existing.version + 1,
          summary: {
            ...(typeof existing.summary === "object" && existing.summary ? existing.summary : {}),
            seoGeoBaseline: true,
          },
        })
        .eq("site_id", site.id)
        .select("*")
        .single();
      if (error || !data) throw new Error(error?.message ?? "client_intelligence_baseline_upgrade_failed");
      await appendClientIntelligenceEvent(db, {
        orgId: site.org_id,
        siteId: site.id,
        actor: opts.actor ?? "system",
        section: "seo_baseline",
        eventMd: "SEO/GEO baseline (Phases 1–4) added to existing CLIENT.md from home-services playbook.",
        evidence: { source: "ensureSeoGeoBaselineInClientMd" },
      });
      return data as ClientIntelligenceFile;
    }
    return existing;
  }

  const clientMd = renderStarterClientMd(site, opts);
  const { data, error } = await db
    .from("client_intelligence_files")
    .insert({
      org_id: site.org_id,
      site_id: site.id,
      client_md: clientMd,
      summary: {
        generatedFrom: "site_profile",
        businessName: site.business_name ?? site.name,
        seoGeoBaseline: true,
      },
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "client_intelligence_file_create_failed");

  await appendClientIntelligenceEvent(db, {
    orgId: site.org_id,
    siteId: site.id,
    actor: opts.actor ?? "system",
    section: "changes",
    eventMd: "Starter CLIENT.md generated from onboarding/site profile + SEO/GEO baseline.",
    evidence: { source: "ensureClientIntelligenceFile" },
  });

  return data as ClientIntelligenceFile;
}

/**
 * After a Local Visibility audit, patch Phase 3 checklist statuses in CLIENT.md.
 */
export async function syncSeoBaselineFromLvs(
  db: SupabaseClient,
  args: {
    orgId: string;
    siteId: string;
    insightIds: string[];
    jobId?: string | null;
    actor?: string;
    primaryCategory?: string | null;
  },
): Promise<ClientIntelligenceFile | null> {
  const file = await getClientIntelligenceFile(db, args.siteId);
  if (!file) return null;

  const withBaseline = ensureSeoGeoBaselineInClientMd(file.client_md, {
    primary_category: args.primaryCategory ?? null,
  });
  const { clientMd, statuses } = applyLvsInsightsToClientMd(withBaseline, args.insightIds);
  if (clientMd === file.client_md) return file;

  const { data, error } = await db
    .from("client_intelligence_files")
    .update({
      client_md: clientMd,
      version: file.version + 1,
      summary: {
        ...(typeof file.summary === "object" && file.summary ? file.summary : {}),
        lastLvsBaselineSync: new Date().toISOString(),
        phase3Statuses: statuses,
      },
    })
    .eq("site_id", args.siteId)
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "client_intelligence_lvs_sync_failed");

  const changed = Object.entries(statuses)
    .map(([id, st]) => `${id}=${st}`)
    .join(", ");

  await appendClientIntelligenceEvent(db, {
    orgId: args.orgId,
    siteId: args.siteId,
    jobId: args.jobId ?? null,
    actor: args.actor ?? "local_visibility_audit",
    section: "seo_baseline",
    eventMd: `Phase 3 (GBP) baseline updated from LVS insights: ${changed || "no status changes"}.`,
    evidence: { insightIds: args.insightIds, statuses },
  });

  return data as ClientIntelligenceFile;
}

export async function getClientIntelligenceFile(
  db: SupabaseClient,
  siteId: string,
): Promise<ClientIntelligenceFile | null> {
  const { data, error } = await db.from("client_intelligence_files").select("*").eq("site_id", siteId).maybeSingle();
  if (error) throw new Error(error.message);
  return (data as ClientIntelligenceFile | null) ?? null;
}

export async function getClientMd(db: SupabaseClient, siteId: string): Promise<string | null> {
  const file = await getClientIntelligenceFile(db, siteId);
  return file?.client_md ?? null;
}

export async function appendClientIntelligenceEvent(
  db: SupabaseClient,
  args: {
    orgId: string;
    siteId: string;
    actor: string;
    section: ClientIntelligenceSection;
    eventMd: string;
    evidence?: Record<string, unknown>;
    jobId?: string | null;
  },
): Promise<ClientIntelligenceEvent> {
  const { data, error } = await db
    .from("client_intelligence_events")
    .insert({
      org_id: args.orgId,
      site_id: args.siteId,
      job_id: args.jobId ?? null,
      actor: args.actor,
      section: args.section,
      event_md: args.eventMd,
      evidence: args.evidence ?? {},
    })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "client_intelligence_event_create_failed");

  const event = data as ClientIntelligenceEvent;
  await patchClientMdWithEvent(db, event);
  return event;
}

async function patchClientMdWithEvent(db: SupabaseClient, event: ClientIntelligenceEvent): Promise<void> {
  const file = await getClientIntelligenceFile(db, event.site_id);
  if (!file) return;

  const sectionTitle = sectionToHeading(event.section);
  const line = `- ${new Date(event.created_at).toISOString().slice(0, 10)}: ${event.event_md}`;
  const nextMd = appendBulletUnderHeading(file.client_md, sectionTitle, line);

  await db
    .from("client_intelligence_files")
    .update({
      client_md: nextMd,
      version: file.version + 1,
      last_event_id: event.id,
    })
    .eq("site_id", event.site_id);
}

function sectionToHeading(section: string): string {
  switch (section) {
    case "who_they_are":
      return "Who They Are";
    case "works":
      return "What We Know Works";
    case "hypotheses":
      return "Current Beliefs We're Testing";
    case "questions":
      return "Open Questions";
    case "seo_baseline":
      // Checklist lives under this heading; narrative notes go to What Changed.
      return "What Changed";
    case "changes":
    default:
      return "What Changed";
  }
}

function appendBulletUnderHeading(md: string, heading: string, bullet: string): string {
  const marker = `## ${heading}`;
  const idx = md.indexOf(marker);
  if (idx === -1) return `${md.trim()}\n\n${marker}\n${bullet}\n`;

  const after = md.indexOf("\n## ", idx + marker.length);
  if (after === -1) return `${md.trim()}\n${bullet}\n`;

  return `${md.slice(0, after).trimEnd()}\n${bullet}\n\n${md.slice(after).trimStart()}`;
}

export async function recentClientIntelligenceEvents(
  db: SupabaseClient,
  siteId: string,
  limit = 20,
): Promise<ClientIntelligenceEvent[]> {
  const { data, error } = await db
    .from("client_intelligence_events")
    .select("*")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as ClientIntelligenceEvent[];
}

export function renderWeeklyBrief(args: {
  site: Site;
  clientMd: string | null;
  events: ClientIntelligenceEvent[];
  jobs: Job[];
}): string {
  const business = args.site.business_name ?? args.site.name;
  const changes = args.events.slice(0, 5).map((e) => e.event_md);
  const jobKinds = Array.from(new Set(args.jobs.map((j) => j.kind))).slice(0, 4);

  const paragraph1 = changes.length
    ? `This week for ${business}, the clearest changes were: ${changes.join(" ")}`
    : `This week for ${business}, we did not record a major new account change yet. The current CLIENT.md remains the baseline for what we believe, what is working, and what still needs testing.`;

  const paragraph2 = jobKinds.length
    ? `Next, keep the focus tight: use ${jobKinds.join(", ")} evidence to update open hypotheses, then make one customer-visible improvement before the next brief. If a fact is still unknown, keep it in Open Questions rather than guessing.`
    : "Next, run the scheduled audit/reporting jobs and convert any real movement into one clear action. If the data is thin, the right next step is to answer the highest-impact Open Question before recommending new work.";

  return `${paragraph1}\n\n${paragraph2}`;
}

export async function upsertWeeklyClientBrief(
  db: SupabaseClient,
  args: { orgId: string; siteId: string; weekStart: string; briefMd: string; sourceJobIds?: string[] },
): Promise<WeeklyClientBrief> {
  const { data, error } = await db
    .from("weekly_client_briefs")
    .upsert({
      org_id: args.orgId,
      site_id: args.siteId,
      week_start: args.weekStart,
      brief_md: args.briefMd,
      source_job_ids: args.sourceJobIds ?? [],
    }, { onConflict: "site_id,week_start" })
    .select("*")
    .single();

  if (error || !data) throw new Error(error?.message ?? "weekly_client_brief_upsert_failed");
  return data as WeeklyClientBrief;
}
