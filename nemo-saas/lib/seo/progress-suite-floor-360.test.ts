import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const progress = readFileSync(
  join(process.env.HOME || "", "Projects/build-assistant/workflows/grokbot-dayshift-progress-2026-09-28.md"),
  "utf8",
);

describe("progress afternoon suite floor", () => {
  it("records a suite count >= 360 after reconnect invents", () => {
    const nums = [...progress.matchAll(/Suite \*\*(\d+)\*\*/g)].map((m) => Number(m[1]));
    expect(nums.length).toBeGreaterThan(0);
    expect(Math.max(...nums)).toBeGreaterThanOrEqual(360);
  });
});
