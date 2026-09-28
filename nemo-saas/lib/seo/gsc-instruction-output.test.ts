import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const instr = readFileSync(
  join(__dirname, "../../../tasks/gsc_opportunity_finder/case_01_basic_pos_4_to_15/instruction.md"),
  "utf8",
);

describe("GSC case_01 instruction", () => {
  it("requires /task/output.json opportunities shape", () => {
    expect(instr.includes("/task/output.json")).toBe(true);
    expect(instr.includes("estimatedMonthlyClickLift")).toBe(true);
    expect(instr.includes("opportunities")).toBe(true);
    expect(instr.includes("impressions >= 100")).toBe(true);
  });
});
