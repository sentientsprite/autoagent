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
import { run } from "@/lib/skills/local_visibility_audit";
import { renderLvsReportPdf } from "@/lib/pdf/lvs-report";
import { LvsEmail } from "@/lib/email/lvs";
import { runLeadFollowUp } from "@/lib/lead-followup";

export const runtime = "nodejs";
export const maxDuration = 30;

const Body = z.object({
  email: z.string().email(),
  businessName: z.string().min(2),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/),
  city: z.string().optional(),
  region: z.string().optional(),
  websiteUrl: z.string().url().optional(),
});

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "invalid_input", detail: String(e) }, { status: 400 });
  }

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
  const { data: lead, error: leadErr } = await db
    .from("leads")
    .insert({
      email: parsed.email,
      business_name: parsed.businessName,
      zip: parsed.zip,
      website_url: parsed.websiteUrl ?? null,
      source: "lvs_wedge",
    })
    .select("id")
    .single();
  if (leadErr || !lead) {
    console.error("lvs lead insert failed", leadErr);
    const msg = leadErr?.message ?? "unknown";
    const missingTable =
      /relation .* does not exist|Could not find the table/i.test(msg) ||
      /schema cache/i.test(msg);
    return NextResponse.json(
      {
        error: "lead_persist_failed",
        detail: msg,
        hint: missingTable
          ? "Run hosted Supabase migrations in order (see nemo-saas/QUICKSTART.md § Hosted Supabase). Then wait ~1m and retry."
          : "Confirm migrations are applied and SUPABASE_SERVICE_ROLE_KEY is the service_role JWT (not anon).",
      },
      { status: 500 },
    );
  }

  // 2. Open an anonymous job row (org_id null is not allowed -> use the special wedge org).
  // For the wedge we attribute jobs to a system org; promotion later moves them.
  const wedgeOrgId = await ensureWedgeOrg(db);
  const { data: job, error: jobErr } = await db
    .from("jobs")
    .insert({
      org_id: wedgeOrgId,
      kind: "local_visibility_audit",
      status: "running",
      input: parsed,
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (jobErr || !job) {
    console.error("lvs job insert failed", jobErr);
    return NextResponse.json(
      {
        error: "job_persist_failed",
        detail: jobErr?.message ?? "unknown",
      },
      { status: 500 },
    );
  }

  // 3. Run skill synchronously with narrative on (it's the wedge — story matters).
  const startedAt = Date.now();
  let result;
  try {
    result = await run(parsed, { withNarrative: true });
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
    zip: parsed.zip,
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

  // 7. Follow-up loop: internal alert, outbound CRM, scheduled nurture (best effort).
  void runLeadFollowUp({
    leadId: lead.id,
    email: parsed.email,
    businessName: parsed.businessName,
    zip: parsed.zip,
    websiteUrl: parsed.websiteUrl,
    grade: result.deterministic.grade,
    score: result.deterministic.score,
    reportUrl,
    topFixTitle: topFix?.title ?? null,
    topFixAction: topFix?.do_this ?? null,
  }).catch((err) => console.error("lvs follow-up failed", err));

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
