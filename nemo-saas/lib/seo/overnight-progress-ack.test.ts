import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const p = join(
  process.env.HOME || "",
  "Projects/build-assistant/workflows/grokbot-overnight-progress-2026-09-28.md",
);

describe("overnight progress ACK", () => {
  it("exists and records tip 6fb36cd / 179 tests", () => {
    expect(existsSync(p)).toBe(true);
    const src = readFileSync(p, "utf8");
    expect(src.includes("6fb36cd")).toBe(true);
    expect(src.includes("179")).toBe(true);
  });
});
