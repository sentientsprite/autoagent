import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const money = readFileSync(join(__dirname, "../billing/money-farm.ts"), "utf8");
const stripe = readFileSync(join(__dirname, "../billing/stripe.ts"), "utf8");

describe("mock Stripe host", () => {
  it("mock checkout/portal URLs use mock.stripe.local", () => {
    expect(money.includes("mock.stripe.local") || stripe.includes("mock.stripe.local")).toBe(true);
    expect(stripe.includes("mock.stripe.local")).toBe(true);
  });
});
