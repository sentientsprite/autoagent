import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const progress = join(
  process.env.HOME || "",
  "Projects/build-assistant/workflows/grokbot-dayshift-progress-2026-09-28.md",
);

describe("dayshift progress ACK", () => {
  it("exists with overnight tip and deadline", () => {
    expect(existsSync(progress)).toBe(true);
    const src = readFileSync(progress, "utf8");
    expect(src.includes("6fb36cd")).toBe(true);
    expect(src.includes("18:00")).toBe(true);
    expect(src.includes("Overnight ACK") || src.includes("overnight")).toBe(true);
  });
});
