import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const script = join(__dirname, "../../../scripts/run-skilleval.sh");

describe("run-skilleval vendors apply engines", () => {
  it("exists and vendors gsc_apply_rules into tests/_shared", () => {
    expect(existsSync(script)).toBe(true);
    const src = readFileSync(script, "utf8");
    expect(src.includes("gsc_apply_rules.py")).toBe(true);
    expect(src.includes("_shared")).toBe(true);
  });
});
