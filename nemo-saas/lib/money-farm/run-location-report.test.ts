import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  loadMoneyFarmFixture,
  runAllLocationReports,
  runLocationReport,
} from "@/lib/money-farm/run-location-report";

describe("money-farm P0 location report (fixture / no live APIs)", () => {
  it("fixture has one org and ≥2 sites", () => {
    const f = loadMoneyFarmFixture();
    expect(f.org.id).toBeTruthy();
    expect(f.sites.length).toBeGreaterThanOrEqual(2);
    expect(Object.keys(f.places_mock ?? {}).length).toBeGreaterThanOrEqual(2);
  });

  it("runs fixture Places → PDF + email stubs for all locations", async () => {
    const outDir = path.join(process.cwd(), ".tmp/money-farm/vitest");
    const results = await runAllLocationReports({
      outDir,
      forceFixturePlaces: true,
    });
    expect(results.length).toBeGreaterThanOrEqual(2);
    for (const r of results) {
      expect(r.mode).toBe("fixture_places");
      expect(r.deterministic.evidence.placeFound).toBe(true);
      expect(existsSync(r.pdfPath)).toBe(true);
      expect(existsSync(r.emailPath)).toBe(true);
      expect(r.pdfBytes).toBeGreaterThan(50);
      expect(r.emailSent).toBe(false);
      expect(readFileSync(r.emailPath, "utf8")).toContain("Money Farm P0 stub");
    }
  });

  it("single site run respects siteId", async () => {
    const f = loadMoneyFarmFixture();
    const site = f.sites[1];
    const r = await runLocationReport({
      orgId: f.org.id,
      siteId: site.id,
      outDir: path.join(process.cwd(), ".tmp/money-farm/vitest-one"),
      forceFixturePlaces: true,
    });
    expect(r.siteId).toBe(site.id);
    expect(r.deterministic.grade).toMatch(/^[A-F]$/);
  });
});
