import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const script = join(__dirname, "../../../tasks/_shared/ga4_apply_rules.py");
const lvs = join(__dirname, "../../../tasks/_shared/lvs_apply_rules.py");

describe("GA4 + LVS apply on disk", () => {
  it("ga4 and lvs apply engines exist beside gsc", () => {
    expect(existsSync(script)).toBe(true);
    expect(existsSync(lvs)).toBe(true);
    expect(readFileSync(script, "utf8").includes("insights") || readFileSync(script, "utf8").includes("output")).toBe(true);
    expect(readFileSync(lvs, "utf8").length).toBeGreaterThan(50);
  });
});
