import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const idx = readFileSync(
  join(process.env.HOME || "", "Projects/build-assistant/workflows/nemo-dayshift-inventions-index-2026-09-28.md"),
  "utf8",
);

describe("hard-stops never list", () => {
  it("inventions index Never: covers LIVE/Serper/presence/force-push/pSEO11", () => {
    expect(idx.includes("Never:")).toBe(true);
    expect(idx.includes("Serper")).toBe(true);
    expect(idx.includes("force-push")).toBe(true);
    expect(idx.includes("pSEO")).toBe(true);
    expect(idx.includes("presence") || idx.includes("Harbor")).toBe(true);
  });
});
