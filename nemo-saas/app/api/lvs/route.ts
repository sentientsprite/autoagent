/**
 * POST /api/lvs
 *
 * The wedge endpoint. Anonymous (no auth). Accepts business name + zip +
 * optional website + email. Runs `local_visibility_audit` synchronously,
 * writes the lead + job, persists the PDF artifact, fires the email.
 *
 * Hard limit: 10s end-to-end. If the synchronous run blows budget, fall back
 * to "we'll email it shortly" and enqueue Inngest. (Phase 1 pessimism: do it
 * sync first, observe, optimize.)
 */
import { NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";
import { render } from "@react-email/render";
import React from "react";

import { dbAsService } from "@/lib/db/client";
import { classifySupabaseError } from "@/lib/db/errors";
import { run } from "@/lib/skills/local_visibility_audit";
import { insightsToActionItems } from "@/lib/skills/local_visibility_audit/action-items";
import { renderLvsReportPdf } from "@/lib/pdf/lvs-report";
import { LvsEmail } from "@/lib/email/lvs";
import { runLeadFollowUp } from "@/lib/lead-followup";
import {
  TargetKeyword,
  targetKeywordsFromStrategyExport,
} from "@/lib/keywords/crm-importer";

export const runtime = "nodejs";
export const maxDuration = 30;

const Body = z.object({
  email: z.string().email(),
  businessName: z.string().min(2),
  city: z.string().min(2),
  region: z.string().optional(),
  /** Optional — not used for Google Places ranking. */
  zip: z.string().optional(),
  websiteUrl: z.string().url().optional(),
  googleMapsUrl: z.string().url().optional(),
  /** Phase 2 — explicit strategy phrases for on-page presence (kw.*). */
  targetKeywords: z.array(TargetKeyword).max(60).optional(),
  /**
   * Non-prod only: when true and targetKeywords omitted, load
   * fixtures/keywords/page-keyword-strategy.export.json.
   * Ignored in production unless ALLOW_LVS_KEYWORD_FIXTURES=1.
   * (No multi-brand brandCode — Owner 2026-09-21.)
   */
  useKeywordFixture: z.boolean().optional(),
});

function allowKeywordFixtures(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_LVS_KEYWORD_FIXTURES === "1"
  );
}

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "invalid_input", detail: String(e) }, { status: 400 });
  }

  let targetKeywords = parsed.targetKeywords;
  if ((!targetKeywords || targetKeywords.length === 0) && parsed.useKeywordFixture) {
    if (!allowKeywordFixtures()) {
      return NextResponse.json(
        {
          error: "keyword_fixture_not_allowed",
          detail: "useKeywordFixture is disabled in production",
        },
        { status: 400 },
      );
    }
    try {
      targetKeywords = targetKeywordsFromStrategyExport({ max: 40 });
    } catch (e) {
      return NextResponse.json(
        { error: "keyword_fixture_load_failed", detail: String(e) },
        { status: 400 },
      );
    }
  }

  const auditInput = {
    businessName: parsed.businessName,
    city: parsed.city,
    region: parsed.region,
    zip: parsed.zip,
    websiteUrl: parsed.websiteUrl,
    googleMapsUrl: parsed.googleMapsUrl,
    targetKeywords,
  };

  let db;
  try {
    db = dbAsService();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: "supabase_misconfigured", detail: msg },
      { status: 503 },
    );
  }

  // 1. Persist the lead immediately so we never lose an email even if the audit fails.
  const leadRes = await db
    .from("leads")
    .insert({
      email: parsed.email,
      business_name: parsed.businessName,
      zip: parsed.zip?.trim() || null,
      website_url: parsed.websiteUrl ?? null,
      source: "lvs_wedge",
    })
    .select("id")
    .single();
  const { data: lead, error: leadErr } = leadRes;
  if (leadErr || !lead) {
    // Classify by the layer that actually failed. "TypeError: fetch failed"
    // (HTTP status 0) means the Supabase host is unreachable — migration and
    // key hints are the wrong layer for that signature.
    const classified = classifySupabaseError({ ...leadErr, status: leadRes.status });
    console.error("lvs lead insert failed", {
      category: classified.category,
      status: leadRes.status,
      message: leadErr?.message,
      details: leadErr?.details,
    });
    return NextResponse.json(
      {
        error: "lead_persist_failed",
        category: classified.category,
        detail: leadErr?.message ?? "unknown",
        hint: classified.hint,
      },
      { status: classified.category === "unreachable_host" ? 502 : 500 },
    );
  }

  // 2. Open an anonymous job row (org_id null is not allowed -> use the special wedge org).
  // For the wedge we attribute jobs to a system org; promotion later moves them.
  const wedgeOrgId = await ensureWedgeOrg(db);
  const jobRes = await db
    .from("jobs")
    .insert({
      org_id: wedgeOrgId,
      kind: "local_visibility_audit",
      status: "running",
      input: { ...parsed, targetKeywords },
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  const { data: job, error: jobErr } = jobRes;

  if (jobErr || !job) {
    const classified = classifySupabaseError({ ...jobErr, status: jobRes.status });
    console.error("lvs job insert failed", {
      category: classified.category,
      status: jobRes.status,
      message: jobErr?.message,
      details: jobErr?.details,
    });
    return NextResponse.json(
      {
        error: "job_persist_failed",
        category: classified.category,
        detail: jobErr?.message ?? "unknown",
        hint: classified.hint,
      },
      { status: classified.category === "unreachable_host" ? 502 : 500 },
    );
  }

  // 3. Run skill synchronously with narrative on (it's the wedge — story matters).
  const startedAt = Date.now();
  let result;
  try {
    result = await run(auditInput, { withNarrative: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("lvs audit failed", err);
    await db.from("jobs").update({
      status: "failed",
      error_message: msg.slice(0, 2000),
      finished_at: new Date().toISOString(),
    }).eq("id", job.id);
    return NextResponse.json(
      {
        error: "audit_failed",
        detail: msg,
        hint:
          "Most narrative failures are skipped automatically. If this persists, check Vercel logs — possible Zod/schema error in insights.",
      },
      { status: 500 },
    );
  }
  const durationMs = Date.now() - startedAt;

  // 4. Render PDF.
  const pdf = await renderLvsReportPdf({
    businessName: parsed.businessName,
    location: [parsed.city, parsed.region].filter(Boolean).join(", "),
    zip: parsed.zip || undefined,
    deterministic: result.deterministic,
    narrative: result.narrative,
    generatedAt: new Date(),
  });

  const storagePath = `wedge/${lead.id}.pdf`;
  await db.storage.from("public-reports").upload(storagePath, pdf, {
    contentType: "application/pdf",
    upsert: true,
  });
  const { data: pub } = db.storage.from("public-reports").getPublicUrl(storagePath);
  const reportUrl = pub.publicUrl;

  // 5. Save artifact + finalize job.
  await db.from("artifacts").insert({
    job_id: job.id,
    org_id: wedgeOrgId,
    kind: "pdf",
    storage_path: storagePath,
    filename: `${slug(parsed.businessName)}-lvs.pdf`,
    byte_size: pdf.byteLength,
    mime_type: "application/pdf",
  });
  await db.from("jobs").update({
    status: "succeeded",
    result: result.deterministic as unknown as Record<string, unknown>,
    duration_ms: durationMs,
    llm_tokens_in: result.llmUsage?.tokensIn ?? null,
    llm_tokens_out: result.llmUsage?.tokensOut ?? null,
    finished_at: new Date().toISOString(),
    }).eq("id", job.id);
  await db.from("leads").update({ audit_job_id: job.id }).eq("id", lead.id);

  // Build a lightweight preview so the on-page scorecard has substance
  // without leaking the full report (that lives in the PDF).
  const insights = result.deterministic.insights;
  const criticalCount = insights.filter((i) => i.severity === "critical").length;
  const warningCount = insights.filter((i) => i.severity === "warning").length;
  const winCount = insights.filter((i) => i.severity === "win").length;
  const narrativeFix = result.narrative?.topFixes?.[0];
  const fallbackFix =
    insights.find((i) => i.severity === "critical") ??
    insights.find((i) => i.severity === "warning") ??
    insights[0];
  const topFix = narrativeFix
    ? { title: narrativeFix.title, do_this: narrativeFix.do_this }
    : fallbackFix
      ? { title: fallbackFix.title, do_this: fallbackFix.action }
      : null;
  const actionItems = insightsToActionItems(insights);

  // 6. Email the lead. Best effort — don't fail the wedge if Resend is down.
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const html = await render(
        React.createElement(LvsEmail, {
          businessName: parsed.businessName,
          grade: result.deterministic.grade,
          reportUrl,
          topFix: result.narrative?.topFixes?.[0]?.do_this,
        }),
      );
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "Nemo Local <reports@nemo.local>",
        to: parsed.email,
        subject: `Your Local Visibility Score: ${result.deterministic.grade}`,
        html,
        attachments: [
          { filename: `${slug(parsed.businessName)}-lvs.pdf`, content: pdf.toString("base64") },
        ],
      });
    } catch {
      // swallow — the user still has the report URL
    }
  }

  // 7. Follow-up loop: internal alert, outbound CRM, scheduled nurture.
  // This is still best-effort inside runLeadFollowUp, but awaiting it keeps
  // Vercel from ending the function before the CRM sync starts.
  const followUp = await runLeadFollowUp({
    leadId: lead.id,
    email: parsed.email,
    businessName: parsed.businessName,
    zip: parsed.zip || null,
    city: parsed.city,
    websiteUrl: parsed.websiteUrl,
    grade: result.deterministic.grade,
    score: result.deterministic.score,
    reportUrl,
    topFixTitle: topFix?.title ?? null,
    topFixAction: topFix?.do_this ?? null,
  });

  return NextResponse.json({
    ok: true,
    grade: result.deterministic.grade,
    score: result.deterministic.score,
    reportUrl,
    headline: result.narrative?.headline ?? null,
    findingCount: insights.length,
    criticalCount,
    warningCount,
    winCount,
    topFix,
    actionItems,
    followUp,
  });
}

async function ensureWedgeOrg(db: ReturnType<typeof dbAsService>): Promise<string> {
  const { data } = await db.from("orgs").select("id").eq("slug", "nemo-wedge").maybeSingle();
  if (data) return data.id;
  const { data: created } = await db.from("orgs")
    .insert({ name: "Nemo Wedge", slug: "nemo-wedge", plan: "free" })
    .select("id")
    .single();
  return created!.id;
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^\w]+/g, "-").replace(/^-|-$/g, "");
}
