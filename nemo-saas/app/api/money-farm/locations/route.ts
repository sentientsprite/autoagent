/**
 * GET /api/money-farm/locations?orgId=
 * HQ stub: list sites under plan location cap (Money Farm P1 slice).
 *
 * Query fixture=1 → return shaped fixture JSON (non-production; 403 in production).
 * Optional plan= → PlanTier override for demos (validated; invalid → 400 invalid_plan).
 * Non-production auto-fallback to fixture when DB / org / sites lookup fails.
 */
import { NextResponse } from "next/server";

import { dbAsService } from "@/lib/db/client";
import { locationCap } from "@/lib/billing/money-farm";
import type { PlanTier } from "@/lib/db/types";
import {
  isKnownPlanTier,
  isNonProductionEnv,
  loadLocationsFixtureFile,
  resolveFixtureLocationsResponse,
  type MapLocationsFixtureOpts,
} from "@/lib/money-farm/locations-fixture";

export const runtime = "nodejs";
export const maxDuration = 30;

function parsePlanOverride(
  raw: string | null,
): { ok: true; plan?: PlanTier } | { ok: false } {
  if (raw == null || raw.trim() === "") {
    return { ok: true };
  }
  const plan = raw.trim();
  if (!isKnownPlanTier(plan)) {
    return { ok: false };
  }
  return { ok: true, plan };
}

function fixtureFallbackResponse(
  orgId: string,
  reason: string,
  planOverride?: PlanTier,
) {
  try {
    const opts: MapLocationsFixtureOpts = {
      note: `Non-production fixture fallback (${reason}). Fixture plan as-is with locationCap${
        planOverride ? ` (planOverride=${planOverride})` : ""
      }.`,
      planOverride,
    };
    const fixture = loadLocationsFixtureFile();
    const resolved = resolveFixtureLocationsResponse(orgId, fixture, opts);
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 404 });
    }
    return NextResponse.json(resolved.body);
  } catch (e) {
    return NextResponse.json(
      { error: "fixture_load_failed", detail: String(e) },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const orgId = url.searchParams.get("orgId")?.trim();
  const wantFixture = url.searchParams.get("fixture") === "1";
  const planParam = url.searchParams.get("plan");
  const planParsed = parsePlanOverride(planParam);

  if (!orgId || !/^[0-9a-f-]{36}$/i.test(orgId)) {
    return NextResponse.json({ error: "invalid_org_id" }, { status: 400 });
  }

  if (!planParsed.ok) {
    return NextResponse.json(
      {
        error: "invalid_plan",
        detail: "plan must be one of: free, local_autopilot, growth_operator, agency",
      },
      { status: 400 },
    );
  }
  const planOverride = planParsed.plan;

  if (wantFixture) {
    if (!isNonProductionEnv()) {
      return NextResponse.json({ error: "fixture_forbidden_in_production" }, { status: 403 });
    }
    try {
      const fixture = loadLocationsFixtureFile();
      const resolved = resolveFixtureLocationsResponse(orgId, fixture, {
        planOverride,
        note: planOverride
          ? `Explicit fixture=1 — planOverride=${planOverride} (raw fixture plan left intact).`
          : "Explicit fixture=1 — plan as-is with locationCap (free+2 sites may show atCap).",
      });
      if (!resolved.ok) {
        return NextResponse.json({ error: resolved.error }, { status: 404 });
      }
      return NextResponse.json(resolved.body);
    } catch (e) {
      return NextResponse.json(
        { error: "fixture_load_failed", detail: String(e) },
        { status: 500 },
      );
    }
  }

  try {
    let db;
    try {
      db = dbAsService();
    } catch (e) {
      if (isNonProductionEnv()) {
        return fixtureFallbackResponse(orgId, `dbAsService: ${String(e)}`, planOverride);
      }
      return NextResponse.json({ error: "locations_failed", detail: String(e) }, { status: 500 });
    }

    const { data: org, error: orgErr } = await db
      .from("orgs")
      .select("id, name, slug, plan")
      .eq("id", orgId)
      .maybeSingle();
    if (orgErr) {
      if (isNonProductionEnv()) {
        return fixtureFallbackResponse(orgId, `org_lookup_failed: ${orgErr.message}`, planOverride);
      }
      return NextResponse.json({ error: "org_lookup_failed", detail: orgErr.message }, { status: 502 });
    }
    if (!org) {
      if (isNonProductionEnv()) {
        return fixtureFallbackResponse(orgId, "org_not_found", planOverride);
      }
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
      if (isNonProductionEnv()) {
        return fixtureFallbackResponse(orgId, `sites_lookup_failed: ${sitesErr.message}`, planOverride);
      }
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
    if (isNonProductionEnv()) {
      return fixtureFallbackResponse(orgId, `locations_failed: ${String(e)}`, planOverride);
    }
    return NextResponse.json({ error: "locations_failed", detail: String(e) }, { status: 500 });
  }
}
