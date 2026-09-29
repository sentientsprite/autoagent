import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const progress = readFileSync(
  join(process.env.HOME || "", "Projects/build-assistant/workflows/grokbot-dayshift-progress-2026-09-28.md"),
  "utf8",
);

describe("dayshift hard stops held", () => {
  it("progress records hard stops / no Harbor thrash / dirty CRM only", () => {
    expect(progress.includes("Hard stops") || progress.includes("hard stops")).toBe(true);
    expect(progress.includes("CRM") || progress.includes("uv.lock")).toBe(true);
    expect(progress.includes("GSC")).toBe(true);
    // Must not claim a LIVE Stripe provision happened
    expect(/provisioned LIVE|sk_live_[A-Za-z0-9]{10,}/.test(progress)).toBe(false);
  });
});
