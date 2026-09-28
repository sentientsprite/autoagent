import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const script = join(__dirname, "../../../scripts/run-skilleval.sh");

describe("run-skilleval.sh present", () => {
  it("exists, is non-empty, references OLLAMA or harbor job wiring", () => {
    expect(existsSync(script)).toBe(true);
    expect(statSync(script).size).toBeGreaterThan(100);
    const src = readFileSync(script, "utf8");
    expect(src.includes("gsc_apply_rules") || src.includes("_shared")).toBe(true);
    expect(/harbor|OLLAMA|job/i.test(src)).toBe(true);
  });
});
