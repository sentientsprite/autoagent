import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const sh = readFileSync(join(__dirname, "../../../scripts/run-skilleval.sh"), "utf8");

describe("run-skilleval.sh vendors shared apply engines", () => {
  it("copies lvs_apply_rules.py and gsc_apply_rules.py into tests/_shared", () => {
    expect(sh.includes("lvs_apply_rules.py")).toBe(true);
    expect(sh.includes("gsc_apply_rules.py")).toBe(true);
    expect(sh.includes('tests_dir/_shared')).toBe(true);
  });
});
