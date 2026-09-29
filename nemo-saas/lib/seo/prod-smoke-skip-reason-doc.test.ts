import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const progress = readFileSync(
  join(process.env.HOME || "", "Projects/build-assistant/workflows/grokbot-dayshift-progress-2026-09-28.md"),
  "utf8",
);
const brief = readFileSync(
  join(process.env.HOME || "", "Projects/build-assistant/workflows/nemo-skilleval-mon-owner-brief-2026-09-28.md"),
  "utf8",
);

describe("prod smoke SKIP documented", () => {
  it("progress/brief record SKIP (no deploy) posture", () => {
    expect(progress.includes("SKIP") || progress.includes("Prod smoke")).toBe(true);
    expect(brief.includes("SKIP") || brief.includes("Prod smoke")).toBe(true);
  });
});
