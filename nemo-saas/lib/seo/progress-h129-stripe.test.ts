import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const progress = readFileSync(
  join(process.env.HOME || "", "Projects/build-assistant/workflows/grokbot-dayshift-progress-2026-09-28.md"),
  "utf8",
);

describe("progress records H129 Stripe LIVE parity", () => {
  it("mentions H129 and LIVE refuse / stripe", () => {
    expect(progress.includes("H129")).toBe(true);
    expect(progress.includes("LIVE") || progress.includes("stripe")).toBe(true);
    expect(progress.includes("ALLOW_STRIPE_LIVE") || progress.includes("refuse") || progress.includes("parity")).toBe(true);
  });
});
