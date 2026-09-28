import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const shared = join(__dirname, "../../../tasks/_shared");

describe("apply-rules trio present on disk", () => {
  it("ships lvs + gsc + ga4 apply engines", () => {
    for (const name of ["lvs_apply_rules.py", "gsc_apply_rules.py", "ga4_apply_rules.py"]) {
      const p = join(shared, name);
      expect(existsSync(p), name).toBe(true);
      const src = readFileSync(p, "utf8");
      expect(src.includes("/task/output.json") || src.includes("output.json"), name).toBe(true);
    }
  });
});
