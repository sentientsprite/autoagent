import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "../../..");
const caseDir = join(root, "tasks/gsc_opportunity_finder/case_01_basic_pos_4_to_15");

describe("Harbor GSC case_01 metadata", () => {
  it("task.toml names skill and expected top page", () => {
    const toml = readFileSync(join(caseDir, "task.toml"), "utf8");
    expect(toml.includes('skill = "gsc_opportunity_finder"')).toBe(true);
    expect(toml.includes("water-heater-repair")).toBe(true);
    expect(toml.includes("timeout_sec")).toBe(true);
  });

  it("ships instruction input expected and apply script on disk", () => {
    expect(existsSync(join(caseDir, "instruction.md"))).toBe(true);
    expect(existsSync(join(caseDir, "files/input.json"))).toBe(true);
    expect(existsSync(join(caseDir, "files/expected.json"))).toBe(true);
    expect(existsSync(join(root, "tasks/_shared/gsc_apply_rules.py"))).toBe(true);
    expect(existsSync(join(root, "tasks/_shared/ga4_apply_rules.py"))).toBe(true);
  });
});
