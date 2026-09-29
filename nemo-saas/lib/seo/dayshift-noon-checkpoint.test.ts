import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const progress = readFileSync(
  join(process.env.HOME || "", "Projects/build-assistant/workflows/grokbot-dayshift-progress-2026-09-28.md"),
  "utf8",
);

describe("dayshift noon checkpoint", () => {
  it("progress log contains Midday or Noon checkpoint", () => {
    expect(/Midday recount|Noon checkpoint/.test(progress)).toBe(true);
  });
});
