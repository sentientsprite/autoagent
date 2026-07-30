import { describe, expect, it } from "vitest";

import {
  applyBaselineStatusesToClientMd,
  phase3StatusesFromLvsInsights,
  renderSeoGeoBaselineSection,
  tradeOverlayForCategory,
  upsertSeoGeoBaselineSection,
} from "./seo-geo-baseline";
import { renderStarterClientMd } from "./client-intelligence";
import type { Site } from "./db/types";

const site = {
  id: "00000000-0000-0000-0000-000000000001",
  org_id: "00000000-0000-0000-0000-000000000002",
  name: "acme",
  business_name: "Acme Plumbing",
  primary_category: "Plumber",
  website_url: "https://example.com",
  phone: "555-0100",
  city: "Denver",
  region: "CO",
  postal_code: "80202",
  street_address: null,
  service_area_zips: ["80202", "80203"],
  playbook_md: null,
} as unknown as Site;

describe("seo-geo-baseline", () => {
  it("renders all four phases and a plumbing trade overlay", () => {
    const md = renderSeoGeoBaselineSection({ primaryCategory: "Plumber" });
    expect(md).toContain("## SEO/GEO Baseline (2026)");
    expect(md).toContain("### Phase 1 — Technical entity alignment");
    expect(md).toContain("### Phase 3 — Local Map Pack & GBP");
    expect(md).toContain("`p3.photos`");
    expect(md).toMatch(/Emergency intent/);
  });

  it("marks Phase 3 blocked when GBP is missing", () => {
    const statuses = phase3StatusesFromLvsInsights(["gbp.not_found"]);
    expect(statuses["p3.hours"]).toBe("blocked");
    expect(statuses["p3.photos"]).toBe("blocked");
  });

  it("marks thin photos as todo when that insight fires", () => {
    const statuses = phase3StatusesFromLvsInsights(["gbp.thin_photos"]);
    expect(statuses["p3.photos"]).toBe("todo");
  });

  it("applies checkbox status rewrites by item id", () => {
    const base = renderSeoGeoBaselineSection({});
    const next = applyBaselineStatusesToClientMd(base, { "p3.photos": "done" });
    expect(next).toContain("- [x] `p3.photos` —");
  });

  it("upserts baseline before Open Questions", () => {
    const md = "# X\n\n## Open Questions\n- q\n";
    const next = upsertSeoGeoBaselineSection(md, renderSeoGeoBaselineSection({}));
    expect(next.indexOf("## SEO/GEO Baseline (2026)")).toBeLessThan(next.indexOf("## Open Questions"));
  });
});

describe("renderStarterClientMd", () => {
  it("embeds the SEO/GEO baseline and trade overlay", () => {
    const md = renderStarterClientMd(site);
    expect(md).toContain("Acme Plumbing Intelligence File");
    expect(md).toContain("## SEO/GEO Baseline (2026)");
    expect(md).toContain("Emergency intent");
    expect(tradeOverlayForCategory("HVAC")).toMatch(/Seasonal sequencing/);
  });
});
