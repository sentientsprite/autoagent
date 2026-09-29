import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const toml = join(
  __dirname,
  "../../../tasks/gsc_opportunity_finder/case_01_basic_pos_4_to_15/task.toml",
);

describe("GSC case_01 task.toml", () => {
  it("names gsc_opportunity_finder skill and case", () => {
    expect(existsSync(toml)).toBe(true);
    const src = readFileSync(toml, "utf8");
    expect(src.includes("gsc_opportunity_finder")).toBe(true);
    expect(src.includes("gsc.case_01") || src.includes("case_01")).toBe(true);
    expect(src.includes("timeout_sec")).toBe(true);
  });
});
