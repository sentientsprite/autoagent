import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(
  join(process.env.HOME || "", "Projects/build-assistant/workflows/nemo-dayshift-hardening-changelog-2026-09-28.md"),
  "utf8",
);

describe("changelog afternoon notes", () => {
  it("mentions reconnect, GSC PASS, Stripe LIVE refuse, dirty CRM", () => {
    expect(src.includes("reconnect") || src.includes("Reconnect") || src.includes("17:17")).toBe(true);
    expect(src.includes("GSC") && src.includes("1.000")).toBe(true);
    expect(src.includes("ALLOW_STRIPE_LIVE") || src.includes("Stripe LIVE")).toBe(true);
    expect(src.includes("uv.lock") || src.includes("import_rk_crm")).toBe(true);
  });
});
