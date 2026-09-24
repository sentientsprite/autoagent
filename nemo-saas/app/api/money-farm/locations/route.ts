/**
 * GET /api/money-farm/locations?orgId=
 * HQ stub: list sites under plan location cap (Money Farm P1 slice).
 */
import { NextResponse } from "next/server";

import { dbAsService } from "@/lib/db/client";
import { locationCap } from "@/lib/billing/money-farm";
import type { PlanTier } from "@/lib/db/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(req: Request) {
  const orgId = new URL(req.url).searchParams.get("orgId")?.trim();
  if (!orgId || !/^[0-9a-f-]{36}$/i.test(orgId)) {
    return NextResponse.json({ error: "invalid_org_id" }, { status: 400 });
  }

  try {
    const db = dbAsService();
    const { data: org, error: orgErr } = await db
      .from("orgs")
      .select("id, name, slug, plan")
      .eq("id", orgId)
      .maybeSingle();
    if (orgErr) {
      return NextResponse.json({ error: "org_lookup_failed", detail: orgErr.message }, { status: 502 });
    }
    if (!org) {
      return NextResponse.json({ error: "org_not_found" }, { status: 404 });
    }

    const plan = (org.plan ?? "free") as PlanTier;
    const cap = locationCap(plan);
    const { data: sites, error: sitesErr } = await db
      .from("sites")
      .select(
        "id, name, business_name, city, region, postal_code, website_url, primary_category",
      )
      .eq("org_id", orgId)
      .order("created_at", { ascending: true });
    if (sitesErr) {
      return NextResponse.json({ error: "sites_lookup_failed", detail: sitesErr.message }, { status: 502 });
    }

    const list = sites ?? [];
    return NextResponse.json({
      org: { id: org.id, name: org.name, slug: org.slug, plan },
      locationCap: cap,
      locationCount: list.length,
      atCap: list.length >= cap,
      locations: list.map((s) => ({
        siteId: s.id,
        name: s.name,
        businessName: s.business_name ?? s.name,
        city: s.city,
        region: s.region,
        postalCode: s.postal_code,
        websiteUrl: s.website_url,
        category: s.primary_category,
      })),
      note: "HQ dashboard UI later — this JSON is the P1 stub under location caps.",
    });
  } catch (e) {
    return NextResponse.json({ error: "locations_failed", detail: String(e) }, { status: 500 });
  }
}
