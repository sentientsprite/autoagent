import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const p = join(
  process.env.HOME || "",
  "Projects/build-assistant/workflows/nemo-dayshift-inventions-index-2026-09-28.md",
);

describe("dayshift inventions index", () => {
  it("exists and forbids thrash/LIVE/Serper", () => {
    expect(existsSync(p)).toBe(true);
    const src = readFileSync(p, "utf8");
    expect(src.includes("gsc_apply_rules")).toBe(true);
    expect(src.includes("Never:")).toBe(true);
    expect(src.includes("Serper")).toBe(true);
  });
});
