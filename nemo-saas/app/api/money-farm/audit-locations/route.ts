/**
 * POST /api/money-farm/audit-locations
 *
 * Run LVS (+ PDF) for up to plan location cap (≥2 for founding/local_autopilot).
 * P0: gated by MONEY_FARM_AUDIT_SECRET header (not public wedge).
 * dryRun=true skips Places/network (CI / local).
 */
import { NextResponse } from "next/server";
import { z } from "zod";

import { dbAsService } from "@/lib/db/client";
import { locationCap } from "@/lib/billing/money-farm";
import { auditLocations } from "@/lib/money-farm/audit-locations";
import type { PlanTier } from "@/lib/db/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const Location = z.object({
  siteId: z.string().uuid().optional(),
  businessName: z.string().min(2),
  city: z.string().min(2),
  region: z.string().optional(),
  zip: z.string().optional(),
  websiteUrl: z.string().url().optional(),
  googleMapsUrl: z.string().url().optional(),
});

const Body = z.object({
  orgId: z.string().uuid(),
  locations: z.array(Location).min(1).max(20),
  dryRun: z.boolean().optional(),
  /** Persist PDFs to storage when false/omit and not dryRun */
  persist: z.boolean().optional(),
});

function authorized(req: Request): boolean {
  const secret = process.env.MONEY_FARM_AUDIT_SECRET?.trim();
  if (!secret) {
    // Local/dev convenience — refuse in production without secret
    return process.env.NODE_ENV !== "production";
  }
  return req.headers.get("x-money-farm-secret") === secret;
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "invalid_input", detail: String(e) }, { status: 400 });
  }

  let plan: PlanTier = "local_autopilot";
  try {
    const db = dbAsService();
    const { data } = await db.from("orgs").select("plan").eq("id", parsed.orgId).maybeSingle();
    if (data?.plan) plan = data.plan as PlanTier;
  } catch {
    /* default founding-capable plan for stub */
  }

  if (parsed.locations.length < 2 && plan !== "free") {
    // Founding MVP wants ≥2 — warn but still run
  }

  const { cappedTo, results } = await auditLocations({
    plan,
    locations: parsed.locations,
    dryRun: parsed.dryRun === true,
  });

  const persisted: Array<{ siteId?: string; storagePath?: string; reportUrl?: string }> = [];
  if (parsed.persist && !parsed.dryRun) {
    try {
      const db = dbAsService();
      for (const r of results) {
        if (!r.ok || !r.pdf) continue;
        const storagePath = `money-farm/${parsed.orgId}/${slug(r.businessName)}-${Date.now()}.pdf`;
        await db.storage.from("public-reports").upload(storagePath, r.pdf, {
          contentType: "application/pdf",
          upsert: true,
        });
        const { data: pub } = db.storage.from("public-reports").getPublicUrl(storagePath);
        persisted.push({
          siteId: r.siteId,
          storagePath,
          reportUrl: pub.publicUrl,
        });
      }
    } catch (e) {
      return NextResponse.json(
        {
          error: "persist_failed",
          detail: String(e),
          cappedTo,
          results: results.map(stripPdf),
        },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({
    orgId: parsed.orgId,
    plan,
    locationCap: locationCap(plan),
    cappedTo,
    audited: results.length,
    results: results.map(stripPdf),
    persisted,
    note: "Live Places audits need GOOGLE_MAPS_API_KEY. dryRun=true for CI.",
  });
}

function stripPdf<T extends { pdf?: Buffer }>(r: T) {
  const { pdf: _pdf, ...rest } = r;
  return rest;
}

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}
