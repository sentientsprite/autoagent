import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "../../scripts/money-farm-stripe-provision.mjs"), "utf8");

describe("Stripe LIVE DEFER posture", () => {
  it("provision script refuses LIVE and prefers sk_test_", () => {
    expect(src.includes("Prefer sk_test_") || src.includes("sk_test_")).toBe(true);
    expect(src.includes("refuse: LIVE Stripe key detected")).toBe(true);
    expect(src.includes("ALLOW_STRIPE_LIVE")).toBe(true);
  });
});
