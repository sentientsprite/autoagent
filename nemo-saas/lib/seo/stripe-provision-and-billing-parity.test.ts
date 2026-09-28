import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const provision = readFileSync(join(__dirname, "../../scripts/money-farm-stripe-provision.mjs"), "utf8");
const billing = readFileSync(join(__dirname, "../billing/stripe.ts"), "utf8");

describe("Stripe LIVE refuse parity provision+billing", () => {
  it("both gate on ALLOW_STRIPE_LIVE and detect sk_live", () => {
    for (const src of [provision, billing]) {
      expect(src.includes("ALLOW_STRIPE_LIVE")).toBe(true);
      expect(src.includes("sk_live")).toBe(true);
    }
    expect(provision.includes("process.exit(3)")).toBe(true);
    expect(billing.includes("isStripeLiveSecret")).toBe(true);
  });
});
