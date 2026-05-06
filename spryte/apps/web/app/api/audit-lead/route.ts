import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@spryte/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const AuditLeadInputSchema = z.object({
  email: z.string().email().max(320),
  name: z.string().max(120).optional(),
  auditUrl: z.string().url().max(2048).optional(),
  city: z.string().max(120).optional(),
  businessName: z.string().max(200).optional(),
  planInterest: z.enum(["starter", "growth", "pro", "agency"]).optional(),
});

export async function POST(request: Request) {
  const started = Date.now();
  const json: unknown = await request.json().catch(() => null);
  const parsed = AuditLeadInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false as const, error: parsed.error.flatten() },
      { status: 422 },
    );
  }

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      event: "api.audit_lead.received",
      email: parsed.data.email,
      hasAuditUrl: Boolean(parsed.data.auditUrl),
    }),
  );

  let persisted = false;
  if (process.env.DATABASE_URL?.trim()) {
    try {
      await prisma.auditLead.create({
        data: {
          email: parsed.data.email,
          name: parsed.data.name ?? null,
          auditUrl: parsed.data.auditUrl ?? null,
          city: parsed.data.city ?? null,
          businessName: parsed.data.businessName ?? null,
  planInterest: parsed.data.planInterest ?? null,
        },
      });
      persisted = true;
    } catch (e) {
      const message =
        typeof e === "object" && e && "message" in e ? String((e as Error).message) : String(e);
      console.log(
        JSON.stringify({
          timestamp: new Date().toISOString(),
          level: "error",
          event: "api.audit_lead.db_error",
          error: message,
        }),
      );
    }
  }

  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      level: "info",
      event: "api.audit_lead.complete",
      persisted,
      latencyMs: Date.now() - started,
    }),
  );

  return NextResponse.json({ ok: true as const, persisted });
}
