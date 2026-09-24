/**
 * Money Farm HQ — map org-two-locations fixture → GET /api/money-farm/locations JSON.
 * Pure helpers (no Next / DB) so vitest and smoke scripts stay network-free.
 */
import { readFileSync } from "node:fs";
import path from "node:path";

import { locationCap } from "@/lib/billing/money-farm";
import type { PlanTier } from "@/lib/db/types";

/** Seed org id from supabase/seed.sql + fixtures/money-farm/org-two-locations.json */
export const MONEY_FARM_SEED_ORG_ID = "00000000-0000-0000-0000-000000000001";

export interface LocationsFixtureOrg {
  id: string;
  name: string;
  slug: string;
  plan: string;
  stripe_customer_id?: string | null;
}

export interface LocationsFixtureSite {
  id: string;
  org_id: string;
  name: string;
  website_url?: string | null;
  business_name?: string | null;
  city?: string | null;
  region?: string | null;
  postal_code?: string | null;
  primary_category?: string | null;
}

export interface LocationsFixtureFile {
  org: LocationsFixtureOrg;
  sites: LocationsFixtureSite[];
}

export interface LocationsApiLocation {
  siteId: string;
  name: string;
  businessName: string;
  city: string | null;
  region: string | null;
  postalCode: string | null;
  websiteUrl: string | null;
  category: string | null;
}

export interface LocationsApiResponse {
  org: { id: string; name: string; slug: string; plan: PlanTier };
  locationCap: number;
  locationCount: number;
  atCap: boolean;
  locations: LocationsApiLocation[];
  note: string;
  source?: "fixture";
}

export function defaultLocationsFixturePath(): string {
  return path.join(process.cwd(), "fixtures/money-farm/org-two-locations.json");
}

export function loadLocationsFixtureFile(fixturePath?: string): LocationsFixtureFile {
  const fp = fixturePath ?? defaultLocationsFixturePath();
  return JSON.parse(readFileSync(fp, "utf8")) as LocationsFixtureFile;
}

/**
 * Map fixture JSON → live locations API shape.
 * Uses fixture.org.plan as-is with locationCap (free + 2 sites → atCap true).
 */
export function mapLocationsFixtureToResponse(
  fixture: LocationsFixtureFile,
  opts?: { note?: string },
): LocationsApiResponse {
  const plan = (fixture.org.plan ?? "free") as PlanTier;
  const cap = locationCap(plan);
  const list = fixture.sites ?? [];
  const defaultNote =
    "HQ locations fixture — plan as-is with locationCap " +
    `(free+2 sites may show atCap). Mock-safe; no Stripe / Places.`;

  return {
    org: {
      id: fixture.org.id,
      name: fixture.org.name,
      slug: fixture.org.slug,
      plan,
    },
    locationCap: cap,
    locationCount: list.length,
    atCap: list.length >= cap,
    locations: list.map((s) => ({
      siteId: s.id,
      name: s.name,
      businessName: s.business_name ?? s.name,
      city: s.city ?? null,
      region: s.region ?? null,
      postalCode: s.postal_code ?? null,
      websiteUrl: s.website_url ?? null,
      category: s.primary_category ?? null,
    })),
    note: opts?.note ?? defaultNote,
    source: "fixture",
  };
}

/** Whether orgId matches the fixture org (or known seed). */
export function fixtureOrgMatches(orgId: string, fixture: LocationsFixtureFile): boolean {
  return orgId === fixture.org.id || orgId === MONEY_FARM_SEED_ORG_ID;
}

export function isNonProductionEnv(): boolean {
  return process.env.NODE_ENV !== "production";
}

/**
 * Build fixture response for an orgId, or an error code for the route to map to HTTP.
 * - match → response
 * - mismatch → fixture_org_mismatch
 */
export function resolveFixtureLocationsResponse(
  orgId: string,
  fixture: LocationsFixtureFile,
  opts?: { note?: string },
):
  | { ok: true; body: LocationsApiResponse }
  | { ok: false; error: "fixture_org_mismatch" } {
  if (!fixtureOrgMatches(orgId, fixture)) {
    return { ok: false, error: "fixture_org_mismatch" };
  }
  return { ok: true, body: mapLocationsFixtureToResponse(fixture, opts) };
}
