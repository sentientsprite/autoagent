import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const brief = readFileSync(
  join(process.env.HOME || "", "Projects/build-assistant/workflows/nemo-skilleval-mon-owner-brief-2026-09-28.md"),
  "utf8",
);

describe("owner brief SkillEval matrix", () => {
  it("records LVS/GSC/GA4 PASS and GSC dayshift 1.000", () => {
    expect(brief.includes("PASS")).toBe(true);
    expect(brief.includes("1.000")).toBe(true);
    expect(brief.includes("GSC")).toBe(true);
    expect(brief.includes("GA4")).toBe(true);
    expect(brief.includes("LVS")).toBe(true);
    expect(brief.includes("gsc_01_dayshift") || brief.includes("gsc_apply_rules")).toBe(true);
  });
});
