import { describe, expect, it } from "vitest";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const tasks = join(__dirname, "../../../tasks");

describe("GA4 + LVS Harbor case dirs", () => {
  it("ga4_health_brief has traffic_drop + ad_waste cases", () => {
    const base = join(tasks, "ga4_health_brief");
    expect(existsSync(base)).toBe(true);
    const names = readdirSync(base);
    expect(names.some((n) => n.includes("traffic_drop"))).toBe(true);
    expect(names.some((n) => n.includes("ad_waste"))).toBe(true);
  });

  it("local_visibility_audit has at least 3 cases", () => {
    const base = join(tasks, "local_visibility_audit");
    expect(existsSync(base)).toBe(true);
    const cases = readdirSync(base).filter((n) => n.startsWith("case_"));
    expect(cases.length).toBeGreaterThanOrEqual(3);
  });
});
