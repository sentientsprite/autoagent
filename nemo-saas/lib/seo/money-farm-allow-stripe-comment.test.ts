import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "../billing/money-farm.ts"), "utf8");

describe("money-farm ALLOW_STRIPE_LIVE comment", () => {
  it("documents billing refuse parity with ALLOW_STRIPE_LIVE", () => {
    expect(src.includes("ALLOW_STRIPE_LIVE")).toBe(true);
    expect(src.includes("mock.stripe.local")).toBe(true);
  });
});
