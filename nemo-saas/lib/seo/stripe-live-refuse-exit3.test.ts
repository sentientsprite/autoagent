import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "../../scripts/money-farm-stripe-provision.mjs"), "utf8");

describe("Stripe LIVE refuse exit code", () => {
  it("exits 3 on LIVE without ALLOW_STRIPE_LIVE=1", () => {
    expect(src.includes("ALLOW_STRIPE_LIVE")).toBe(true);
    expect(src.includes("process.exit(3)")).toBe(true);
    expect(src.includes('modeHint === "LIVE"') || src.includes("modeHint === 'LIVE'")).toBe(true);
  });
});
