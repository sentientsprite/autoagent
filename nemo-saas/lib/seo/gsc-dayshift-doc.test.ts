import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const p = join(
  process.env.HOME || "",
  "Projects/build-assistant/workflows/nemo-skilleval-gsc01-dayshift-2026-09-28.md",
);

describe("GSC dayshift workflow doc", () => {
  it("records PASS_GATE mean 1.000", () => {
    expect(existsSync(p)).toBe(true);
    const src = readFileSync(p, "utf8");
    expect(src.includes("PASS_GATE")).toBe(true);
    expect(src.includes("1.000")).toBe(true);
    expect(src.includes("gsc_apply_rules")).toBe(true);
  });
});
