import { describe, expect, it } from "vitest";

import { locationCap } from "@/lib/billing/money-farm";
import {
  MONEY_FARM_SEED_ORG_ID,
  isKnownPlanTier,
  loadLocationsFixtureFile,
  mapLocationsFixtureToResponse,
  resolveFixtureLocationsResponse,
  fixtureOrgMatches,
} from "@/lib/money-farm/locations-fixture";

describe("locations fixture → API shape", () => {
  it("loads fixture with seed org and ≥2 sites", () => {
    const f = loadLocationsFixtureFile();
    expect(f.org.id).toBe(MONEY_FARM_SEED_ORG_ID);
    expect(f.sites.length).toBeGreaterThanOrEqual(2);
    expect(f.org.plan).toBe("free");
  });

  it("maps fixture with honest free plan cap (atCap when 2 sites)", () => {
    const f = loadLocationsFixtureFile();
    const body = mapLocationsFixtureToResponse(f);
    expect(body.source).toBe("fixture");
    expect(body.org.id).toBe(f.org.id);
    expect(body.org.plan).toBe("free");
    expect(body.locationCap).toBe(locationCap("free"));
    expect(body.locationCap).toBe(1);
    expect(body.locationCount).toBe(f.sites.length);
    expect(body.atCap).toBe(true);
    expect(body.locations).toHaveLength(f.sites.length);
    expect(body.locations[0]).toMatchObject({
      siteId: f.sites[0].id,
      name: f.sites[0].name,
      businessName: f.sites[0].business_name ?? f.sites[0].name,
      city: f.sites[0].city,
      region: f.sites[0].region,
      postalCode: f.sites[0].postal_code,
      websiteUrl: f.sites[0].website_url,
      category: f.sites[0].primary_category,
    });
    expect(body.note).toBeTruthy();
  });

  it("planOverride local_autopilot raises cap so 2 sites are not atCap", () => {
    const f = loadLocationsFixtureFile();
    expect(f.org.plan).toBe("free");
    const body = mapLocationsFixtureToResponse(f, { planOverride: "local_autopilot" });
    expect(body.org.plan).toBe("local_autopilot");
    expect(body.locationCap).toBe(locationCap("local_autopilot"));
    expect(body.locationCap).toBe(5);
    expect(body.locationCount).toBe(f.sites.length);
    expect(body.locationCount).toBeGreaterThanOrEqual(2);
    expect(body.atCap).toBe(false);
    expect(body.source).toBe("fixture");
    expect(body.note).toMatch(/planOverride=local_autopilot/);
    // Raw fixture file plan must remain free (mapper does not mutate).
    expect(f.org.plan).toBe("free");
  });

  it("isKnownPlanTier accepts locationCap tiers only", () => {
    expect(isKnownPlanTier("free")).toBe(true);
    expect(isKnownPlanTier("local_autopilot")).toBe(true);
    expect(isKnownPlanTier("growth_operator")).toBe(true);
    expect(isKnownPlanTier("agency")).toBe(true);
    expect(isKnownPlanTier("founding")).toBe(false);
    expect(isKnownPlanTier("pro")).toBe(false);
    expect(isKnownPlanTier("")).toBe(false);
  });

  it("allows custom note override", () => {
    const f = loadLocationsFixtureFile();
    const body = mapLocationsFixtureToResponse(f, { note: "fallback: db unavailable" });
    expect(body.note).toBe("fallback: db unavailable");
    expect(body.source).toBe("fixture");
  });

  it("resolveFixtureLocationsResponse matches seed / fixture org", () => {
    const f = loadLocationsFixtureFile();
    expect(fixtureOrgMatches(f.org.id, f)).toBe(true);
    expect(fixtureOrgMatches(MONEY_FARM_SEED_ORG_ID, f)).toBe(true);
    const ok = resolveFixtureLocationsResponse(f.org.id, f);
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.body.locationCount).toBeGreaterThanOrEqual(2);
    }
  });

  it("resolveFixtureLocationsResponse passes planOverride", () => {
    const f = loadLocationsFixtureFile();
    const ok = resolveFixtureLocationsResponse(f.org.id, f, {
      planOverride: "local_autopilot",
    });
    expect(ok.ok).toBe(true);
    if (ok.ok) {
      expect(ok.body.org.plan).toBe("local_autopilot");
      expect(ok.body.atCap).toBe(false);
    }
  });

  it("resolveFixtureLocationsResponse rejects wrong org id", () => {
    const f = loadLocationsFixtureFile();
    const bad = resolveFixtureLocationsResponse("11111111-1111-1111-1111-111111111111", f);
    expect(bad.ok).toBe(false);
    if (!bad.ok) {
      expect(bad.error).toBe("fixture_org_mismatch");
    }
  });
});
