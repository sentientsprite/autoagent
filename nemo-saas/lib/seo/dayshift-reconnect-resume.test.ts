import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const progress = readFileSync(
  join(process.env.HOME || "", "Projects/build-assistant/workflows/grokbot-dayshift-progress-2026-09-28.md"),
  "utf8",
);

describe("dayshift reconnect resume", () => {
  it("records offline window and invent toward FINAL", () => {
    expect(progress.includes("RECONNECT")).toBe(true);
    expect(progress.includes("14:17") || progress.includes("17:17") || progress.includes("17:18")).toBe(true);
    expect(progress.includes("FINAL")).toBe(true);
    expect(progress.includes("H129") || progress.includes("H12")).toBe(true);
  });
});
