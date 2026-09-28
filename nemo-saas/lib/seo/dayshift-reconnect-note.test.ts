import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const progress = join(
  process.env.HOME || "",
  "Projects/build-assistant/workflows/grokbot-dayshift-progress-2026-09-28.md",
);

describe("dayshift reconnect note", () => {
  it("records afternoon reconnect and resume to 18:00 FINAL", () => {
    expect(existsSync(progress)).toBe(true);
    const src = readFileSync(progress, "utf8");
    expect(src.includes("RECONNECT")).toBe(true);
    expect(src.includes("18:00")).toBe(true);
    expect(src.includes("5fb0add") || src.includes("FINAL")).toBe(true);
    expect(src.includes("invent") || src.includes("Resume")).toBe(true);
  });
});
