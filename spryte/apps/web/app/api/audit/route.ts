import { NextResponse } from "next/server";
import { FreeAuditInputSchema, runFreeAudit } from "@spryte/auditor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeBudgetMs(): number {
  const fallback = 28_000;
  const n = Number(process.env.AUDIT_BUDGET_MS ?? fallback);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(29_500, Math.max(5_000, n));
}

export async function POST(request: Request) {
  const started = Date.now();
  const json: unknown = await request.json().catch(() => null);
  const parsed = FreeAuditInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false as const,
        error: parsed.error.flatten(),
      },
      { status: 422 },
    );
  }

  const budgetMs = safeBudgetMs();

  const result = await runFreeAudit({ input: parsed.data, budgetMs });

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      event: "api.audit.complete",
      url: result.url,
      provider: result.model.provider,
      latencyMs_total: Date.now() - started,
    }),
  );

  return NextResponse.json({ ok: true, result });
}
