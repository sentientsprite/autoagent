import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "../../TESTING.md"), "utf8");

describe("TESTING.md dayshift GSC", () => {
  it("records GSC case_01 dayshift PASS and gsc_apply_rules", () => {
    expect(src.includes("SkillEval dayshift")).toBe(true);
    expect(src.includes("gsc_apply_rules")).toBe(true);
    expect(src.includes("1.000")).toBe(true);
  });
});
