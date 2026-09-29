import { describe, expect, it } from "vitest";
import { ensureSeoGeoBaselineInClientMd } from "./client-intelligence";

describe("ensureSeoGeoBaselineInClientMd", () => {
  it("inserts baseline once and is idempotent", () => {
    const base = "# Acme\n\n## Who They Are\n- Business: Acme\n";
    const once = ensureSeoGeoBaselineInClientMd(base, { primary_category: "plumber" });
    expect(once).toContain("## SEO/GEO Baseline (2026)");
    const twice = ensureSeoGeoBaselineInClientMd(once, { primary_category: "plumber" });
    expect(twice).toBe(once);
  });
});
