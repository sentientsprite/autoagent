import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "../billing/money-farm.test.ts"), "utf8");

describe("money-farm LIVE refuse unit present", () => {
  it("money-farm.test covers sk_live without ALLOW_STRIPE_LIVE → mock", () => {
    expect(src.includes("sk_live_dayshift_refuse_example")).toBe(true);
    expect(src.includes("ALLOW_STRIPE_LIVE")).toBe(true);
    expect(src.includes("createFoundingCheckout")).toBe(true);
    expect(src.includes("mock.stripe.local") || src.includes("mock\\.stripe\\.local")).toBe(true);
  });
});
