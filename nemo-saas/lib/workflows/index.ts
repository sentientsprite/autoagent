/**
 * Inngest functions = the supervisor. The "agent team" is a workflow, not an
 * LLM. Each function:
 *   - hydrates job + connectors from Supabase (service role)
 *   - calls one skill (deterministic + optional narrative)
 *   - writes result + artifact + updates job row
 *   - emits a follow-up event when chaining (e.g. audit -> reporter)
 *
 * No LLM-driven step routing. Determinism is the product moat.
 */
import { NonRetriableError } from "inngest";

import { inngest } from "@/lib/inngest/client";
import { dbAsService } from "@/lib/db/client";
import { run as runLvs } from "@/lib/skills/local_visibility_audit";
import { run as runGsc } from "@/lib/skills/gsc_opportunity_finder";
import { run as runGa4 } from "@/lib/skills/ga4_health_brief";
import { run as runLocalLandingBuilder } from "@/lib/skills/local_landing_builder";
import { run as runPaidQa } from "@/lib/skills/paid_qa";
import { run as runReputationLoop } from "@/lib/skills/reputation_loop";
import { run as runCompetitorPulse } from "@/lib/skills/competitor_pulse";
import type { Connector, Site } from "@/lib/db/types";

// =============================================================================
// monthlySiteReport — the headline workflow that bundles audit + GSC + GA4
// =============================================================================

export const monthlySiteReport = inngest.createFunction(
  { id: "monthly-site-report", name: "Monthly site report (audit + GSC + GA4)", retries: 2 },
  { event: "nemo/site.report.monthly" },
  async ({ event, step, logger }) => {
    const { siteId, orgId } = event.data;
    const db = dbAsService();

    const site = await step.run("load-site", async () => {
      const { data, error } = await db.from("sites").select("*").eq("id", siteId).single();
      if (error || !data) throw new NonRetriableError("site_not_found");
      return data as Site;
    });

    const connectors = await step.run("load-connectors", async () => {
      const { data } = await db.from("connectors").select("*").eq("site_id", siteId).eq("status", "connected");
      return (data ?? []) as Connector[];
    });

    const gsc = connectors.find((c) => c.kind === "google_search_console");
    const ga4 = connectors.find((c) => c.kind === "google_analytics_4");

    // 1. Always run the local visibility audit.
    const auditResult = await step.run("local_visibility_audit", async () => {
      if (!site.business_name || !site.postal_code) {
        throw new NonRetriableError("site_missing_local_fields");
      }
      const r = await runLvs({
        businessName: site.business_name,
        zip: site.postal_code,
        city: site.city ?? undefined,
        region: site.region ?? undefined,
        websiteUrl: site.website_url ?? undefined,
        expectedServiceAreaZipCount: site.service_area_zips?.length ?? 1,
      }, { withNarrative: true, site });
      await persistJob(db, { orgId, siteId, kind: "local_visibility_audit", input: { trigger: "monthly" }, result: r.deterministic });
      return r;
    });

    // 2. GSC if connected.
    const gscResult = gsc ? await step.run("gsc_opportunity_finder", async () => {
      const r = await runGsc({ connector: gsc, site, withNarrative: true });
      await persistJob(db, { orgId, siteId, kind: "gsc_opportunity_finder", input: { window: "90d" }, result: r.deterministic });
      return r;
    }) : null;

    // 3. GA4 if connected.
    const ga4Result = ga4 ? await step.run("ga4_health_brief", async () => {
      const r = await runGa4({ connector: ga4, site, withNarrative: true });
      await persistJob(db, { orgId, siteId, kind: "ga4_health_brief", input: { windowDays: 28 }, result: r.deterministic });
      return r;
    }) : null;

    logger.info("monthly report complete", {
      siteId,
      lvsGrade: auditResult.deterministic.grade,
      gscOpps: gscResult?.deterministic.opportunities.length ?? 0,
      ga4Insights: ga4Result?.deterministic.insights.length ?? 0,
    });

    return {
      lvs: auditResult.deterministic.grade,
      gsc: gscResult?.deterministic.opportunities.length ?? 0,
      ga4: ga4Result?.deterministic.insights.length ?? 0,
    };
  },
);

// =============================================================================
// jobRequested — generic single-skill execution path (used by API + dashboard)
// =============================================================================

export const jobRequested = inngest.createFunction(
  { id: "job-requested", name: "Run requested job", retries: 1 },
  { event: "nemo/job.requested" },
  async ({ event, step }) => {
    const { jobId } = event.data;
    const db = dbAsService();

    const job = await step.run("load-job", async () => {
      const { data, error } = await db.from("jobs").select("*").eq("id", jobId).single();
      if (error || !data) throw new NonRetriableError("job_not_found");
      return data;
    });

    await db.from("jobs").update({ status: "running", started_at: new Date().toISOString() }).eq("id", jobId);

    const startedAt = Date.now();
    let result;
    try {
      result = await runSkillByKind(db, job);
    } catch (err) {
      await db.from("jobs").update({
        status: "failed",
        error_message: String(err),
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - startedAt,
      }).eq("id", jobId);
      throw err;
    }

    await db.from("jobs").update({
      status: "succeeded",
      result,
      finished_at: new Date().toISOString(),
      duration_ms: Date.now() - startedAt,
    }).eq("id", jobId);
  },
);

// =============================================================================
// Helpers
// =============================================================================

interface JobRow {
  id: string;
  org_id: string;
  site_id: string | null;
  kind: string;
  input: Record<string, unknown>;
}

async function runSkillByKind(db: ReturnType<typeof dbAsService>, job: JobRow): Promise<unknown> {
  const site = job.site_id
    ? ((await db.from("sites").select("*").eq("id", job.site_id).single()).data as Site | null)
    : null;
  const connectors = job.site_id
    ? (((await db.from("connectors").select("*").eq("site_id", job.site_id).eq("status", "connected")).data ?? []) as Connector[])
    : [];

  switch (job.kind) {
    case "local_visibility_audit": {
      if (!site?.business_name || !site?.postal_code) throw new NonRetriableError("site_missing_local_fields");
      const r = await runLvs({
        businessName: site.business_name,
        zip: site.postal_code,
        city: site.city ?? undefined,
        region: site.region ?? undefined,
        websiteUrl: site.website_url ?? undefined,
        expectedServiceAreaZipCount: site.service_area_zips?.length ?? 1,
      }, { withNarrative: true, site });
      return r.deterministic;
    }
    case "gsc_opportunity_finder": {
      const c = connectors.find((x) => x.kind === "google_search_console");
      if (!site || !c) throw new NonRetriableError("missing_gsc_connector");
      const r = await runGsc({ connector: c, site, withNarrative: true });
      return r.deterministic;
    }
    case "ga4_health_brief": {
      const c = connectors.find((x) => x.kind === "google_analytics_4");
      if (!site || !c) throw new NonRetriableError("missing_ga4_connector");
      const r = await runGa4({ connector: c, site, withNarrative: true });
      return r.deterministic;
    }
    // ----- Stubs: advertised in PLAN_JOBS but gated on a milestone. -----
    // Each throws NonRetriableError so Inngest does not retry; the dashboard
    // surfaces the milestone in error_message. See lib/skills/_shared/stub.ts.
    case "local_landing_builder":
      return (await runLocalLandingBuilder({}, {})).deterministic;
    case "paid_qa":
      return (await runPaidQa({}, {})).deterministic;
    case "reputation_loop":
      return (await runReputationLoop({}, {})).deterministic;
    case "competitor_pulse":
      return (await runCompetitorPulse({}, {})).deterministic;
    default:
      throw new NonRetriableError(`unsupported_kind:${job.kind}`);
  }
}

async function persistJob(
  db: ReturnType<typeof dbAsService>,
  args: { orgId: string; siteId: string; kind: string; input: Record<string, unknown>; result: unknown },
): Promise<void> {
  await db.from("jobs").insert({
    org_id: args.orgId,
    site_id: args.siteId,
    kind: args.kind,
    status: "succeeded",
    input: args.input,
    result: args.result as Record<string, unknown>,
    started_at: new Date().toISOString(),
    finished_at: new Date().toISOString(),
  });
}

export const functions = [monthlySiteReport, jobRequested];
