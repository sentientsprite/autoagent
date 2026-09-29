import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "../../..");

describe("Harbor LVS shared engine", () => {
  it("ships lvs_apply_rules.py with /task paths in docstring", () => {
    const p = join(root, "tasks/_shared/lvs_apply_rules.py");
    expect(existsSync(p)).toBe(true);
    const src = readFileSync(p, "utf8");
    expect(src.includes("/task/files/input.json")).toBe(true);
    expect(src.includes("/task/output.json")).toBe(true);
  });

  it("case_01 fixture exists", () => {
    const base = join(root, "tasks/local_visibility_audit/case_01_missing_phone_and_low_reviews");
    expect(existsSync(join(base, "files/input.json"))).toBe(true);
    expect(existsSync(join(base, "instruction.md"))).toBe(true);
  });
});
