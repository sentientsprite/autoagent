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
import {
  appendClientIntelligenceEvent,
  ensureClientIntelligenceFile,
  getClientMd,
  recentClientIntelligenceEvents,
  renderWeeklyBrief,
  syncSeoBaselineFromLvs,
  upsertWeeklyClientBrief,
} from "@/lib/client-intelligence";
import type { Connector, Job, Site } from "@/lib/db/types";
import { LvsNurtureEmail } from "@/lib/email/lvs-nurture";
import { buildWeeklyContentDrafts, mondayWeekStart } from "@/lib/content-drafts";
import { Resend } from "resend";
import { render } from "@react-email/render";
import React from "react";

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

    const clientMd = await step.run("load-client-intelligence", async () => {
      const file = await ensureClientIntelligenceFile(db, site, { actor: "monthly-site-report" });
      return file.client_md;
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
      }, { withNarrative: true, site, clientMd });
      const jobId = await persistJob(db, {
        orgId,
        siteId,
        kind: "local_visibility_audit",
        input: { trigger: "monthly" },
        result: r.deterministic,
      });
      await syncSeoBaselineFromLvs(db, {
        orgId,
        siteId,
        insightIds: r.deterministic.insights.map((i) => i.id),
        jobId,
        actor: "monthly-site-report",
        primaryCategory: site.primary_category,
      });
      return r;
    });

    // 2. GSC if connected.
    const gscResult = gsc ? await step.run("gsc_opportunity_finder", async () => {
      const r = await runGsc({ connector: gsc, site, withNarrative: true, clientMd });
      await persistJob(db, { orgId, siteId, kind: "gsc_opportunity_finder", input: { window: "90d" }, result: r.deterministic });
      return r;
    }) : null;

    // 3. GA4 if connected.
    const ga4Result = ga4 ? await step.run("ga4_health_brief", async () => {
      const r = await runGa4({ connector: ga4, site, withNarrative: true, clientMd });
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

    if (job.site_id) {
      await appendClientIntelligenceEvent(db, {
        orgId: job.org_id,
        siteId: job.site_id,
        jobId,
        actor: "workflow",
        section: "changes",
        eventMd: `${job.kind} completed successfully.`,
        evidence: { jobId, kind: job.kind },
      });
    }
  },
);

// =============================================================================
// weeklyClientBrief — two-paragraph Monday account note
// =============================================================================

export const weeklyClientBrief = inngest.createFunction(
  { id: "weekly-client-brief", name: "Weekly client brief", retries: 1 },
  { event: "nemo/site.brief.weekly" },
  async ({ event, step }) => {
    const { siteId, orgId, weekStart } = event.data as { siteId: string; orgId: string; weekStart?: string };
    const db = dbAsService();

    const site = await step.run("load-site", async () => {
      const { data, error } = await db.from("sites").select("*").eq("id", siteId).single();
      if (error || !data) throw new NonRetriableError("site_not_found");
      return data as Site;
    });

    const clientMd = await step.run("load-client-intelligence", async () => {
      const file = await ensureClientIntelligenceFile(db, site, { actor: "weekly-client-brief" });
      return file.client_md;
    });

    const events = await step.run("load-recent-intelligence-events", () =>
      recentClientIntelligenceEvents(db, siteId, 20),
    );

    const since = new Date();
    since.setDate(since.getDate() - 7);
    const jobs = await step.run("load-recent-jobs", async () => {
      const { data, error } = await db
        .from("jobs")
        .select("*")
        .eq("site_id", siteId)
        .eq("status", "succeeded")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw new Error(error.message);
      return (data ?? []) as Job[];
    });

    const start = weekStart ?? mondayIsoDate(new Date());
    const brief = await step.run("upsert-weekly-brief", () =>
      upsertWeeklyClientBrief(db, {
        orgId,
        siteId,
        weekStart: start,
        briefMd: renderWeeklyBrief({ site, clientMd, events, jobs }),
        sourceJobIds: jobs.map((j) => j.id),
      }),
    );

    await step.run("append-intelligence-event", () =>
      appendClientIntelligenceEvent(db, {
        orgId,
        siteId,
        actor: "reporter",
        section: "changes",
        eventMd: `Weekly client brief generated for week of ${start}.`,
        evidence: { weeklyClientBriefId: brief.id, sourceJobIds: jobs.map((j) => j.id) },
      }),
    );

    return { briefId: brief.id, weekStart: start };
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
  const clientMd = site ? await getClientMd(db, site.id) : null;
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
      }, { withNarrative: true, site, clientMd });
      await syncSeoBaselineFromLvs(db, {
        orgId: job.org_id,
        siteId: site.id,
        insightIds: r.deterministic.insights.map((i) => i.id),
        jobId: job.id,
        actor: "job-requested",
        primaryCategory: site.primary_category,
      });
      return r.deterministic;
    }
    case "gsc_opportunity_finder": {
      const c = connectors.find((x) => x.kind === "google_search_console");
      if (!site || !c) throw new NonRetriableError("missing_gsc_connector");
      const r = await runGsc({ connector: c, site, withNarrative: true, clientMd });
      return r.deterministic;
    }
    case "ga4_health_brief": {
      const c = connectors.find((x) => x.kind === "google_analytics_4");
      if (!site || !c) throw new NonRetriableError("missing_ga4_connector");
      const r = await runGa4({ connector: c, site, withNarrative: true, clientMd });
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
): Promise<string | null> {
  const { data } = await db.from("jobs").insert({
    org_id: args.orgId,
    site_id: args.siteId,
    kind: args.kind,
    status: "succeeded",
    input: args.input,
    result: args.result as Record<string, unknown>,
    started_at: new Date().toISOString(),
    finished_at: new Date().toISOString(),
  }).select("id").single();

  await appendClientIntelligenceEvent(db, {
    orgId: args.orgId,
    siteId: args.siteId,
    jobId: data?.id ?? null,
    actor: "workflow",
    section: "changes",
    eventMd: `${args.kind} completed successfully.`,
    evidence: { jobId: data?.id ?? null, kind: args.kind },
  });

  return (data?.id as string | undefined) ?? null;
}

function mondayIsoDate(d: Date): string {
  const copy = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = copy.getUTCDay() || 7;
  copy.setUTCDate(copy.getUTCDate() - day + 1);
  return copy.toISOString().slice(0, 10);
}

// =============================================================================
// wedgeLeadFollowUp — nurture email if lead hasn't promoted to a paying org
// =============================================================================

const NURTURE_DELAY_HOURS = Math.max(1, parseInt(process.env.LVS_NURTURE_DELAY_HOURS ?? "48", 10) || 48);

export const wedgeLeadFollowUp = inngest.createFunction(
  { id: "wedge-lead-followup", name: "Wedge lead nurture (48h)", retries: 2 },
  { event: "nemo/lead.wedge.followup" },
  async ({ event, step, logger }) => {
    const { leadId, email, businessName, grade, reportUrl, topFixAction } = event.data;

    await step.sleep("wait-before-nurture", `${NURTURE_DELAY_HOURS}h`);

    const stillOpen = await step.run("check-lead-still-open", async () => {
      const db = dbAsService();
      const { data } = await db.from("leads").select("promoted_org_id").eq("id", leadId).maybeSingle();
      return !data?.promoted_org_id;
    });

    if (!stillOpen) {
      logger.info("lead already promoted — skip nurture", { leadId });
      return { skipped: "promoted" };
    }

    const apiKey = (process.env.RESEND_API_KEY ?? "").trim();
    if (!apiKey) {
      logger.warn("RESEND_API_KEY missing — cannot send nurture");
      return { skipped: "no_resend" };
    }

    await step.run("send-nurture-email", async () => {
      const html = await render(
        React.createElement(LvsNurtureEmail, {
          businessName,
          grade,
          reportUrl,
          topFix: topFixAction,
        }),
      );
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "Nemo Local <reports@nemo.local>",
        to: email,
        subject: `Still thinking about your ${grade} Local Visibility Score?`,
        html,
      });
    });

    return { sent: true, leadId };
  },
);

/**
 * Weekly content/pSEO draft stubs → content_drafts (status=draft).
 * Cron: Mondays 14:00 UTC. Human approves before any publish.
 */
export const weeklyContentDrafts = inngest.createFunction(
  {
    id: "weekly-content-drafts",
    name: "Weekly pSEO content draft batch",
    retries: 1,
  },
  [{ cron: "0 14 * * 1" }, { event: "nemo/content.drafts.weekly" }],
  async ({ event, step, logger }) => {
    const db = dbAsService();
    const payload =
      event && typeof event === "object" && "data" in event && event.data && typeof event.data === "object"
        ? (event.data as { orgId?: string; weekStart?: string })
        : {};
    const weekStart = payload.weekStart || mondayWeekStart();

    const orgId = await step.run("resolve-org", async () => {
      if (payload.orgId) return payload.orgId;
      const { data, error } = await db.from("orgs").select("id").order("created_at", { ascending: true }).limit(1).maybeSingle();
      if (error || !data) throw new NonRetriableError("org_not_found");
      return data.id as string;
    });

    const stubs = buildWeeklyContentDrafts(weekStart);

    const inserted = await step.run("upsert-drafts", async () => {
      let n = 0;
      for (const stub of stubs) {
        const { data: existing } = await db
          .from("content_drafts")
          .select("id")
          .eq("org_id", orgId)
          .eq("week_start", weekStart)
          .eq("channel", stub.channel)
          .eq("title", stub.title)
          .maybeSingle();
        if (existing) continue;

        const { error } = await db.from("content_drafts").insert({
          org_id: orgId,
          site_id: null,
          week_start: weekStart,
          channel: stub.channel,
          title: stub.title,
          body_md: stub.body_md,
          status: "draft",
          meta: stub.meta,
        });
        if (error) {
          logger.error("content_draft insert failed", { error: error.message, title: stub.title });
          continue;
        }
        n += 1;
      }
      return n;
    });

    return { weekStart, orgId, inserted, totalStubs: stubs.length };
  },
);

export const functions = [
  monthlySiteReport,
  jobRequested,
  weeklyClientBrief,
  wedgeLeadFollowUp,
  weeklyContentDrafts,
];
