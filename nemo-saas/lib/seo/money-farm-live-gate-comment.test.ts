import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const money = readFileSync(join(__dirname, "../billing/money-farm.ts"), "utf8");
const stripe = readFileSync(join(__dirname, "../billing/stripe.ts"), "utf8");

describe("money-farm LIVE Owner GATE comments", () => {
  it("documents LIVE as Owner GATE / mock without keys", () => {
    expect(money.includes("Owner") || money.includes("GATE") || money.includes("Live Stripe")).toBe(true);
    expect(stripe.includes("ALLOW_STRIPE_LIVE")).toBe(true);
    expect(stripe.includes("Owner GATE") || stripe.includes("Owner-only")).toBe(true);
  });
});
