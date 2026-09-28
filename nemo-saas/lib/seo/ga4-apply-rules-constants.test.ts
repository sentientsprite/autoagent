import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "../../../tasks/_shared/ga4_apply_rules.py"), "utf8");

describe("ga4_apply_rules thresholds", () => {
  it("encodes traffic_drop -15%, spike +20%, bounce 0.6, ad_waste paid>30%", () => {
    expect(src.includes("-0.15")).toBe(true);
    expect(src.includes("0.2")).toBe(true);
    expect(src.includes("0.6")).toBe(true);
    expect(src.includes("0.3")).toBe(true);
    expect(src.includes("ga.traffic_drop")).toBe(true);
    expect(src.includes("ga.ad_waste")).toBe(true);
  });
});
