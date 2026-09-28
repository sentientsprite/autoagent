import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "../../scripts/money-farm-stripe-provision.mjs"), "utf8");

describe("money-farm-stripe-provision LIVE guard", () => {
  it("detects sk_live/rk_live and labels mode LIVE", () => {
    expect(src.includes('startsWith("sk_live")') || src.includes("startsWith('sk_live')")).toBe(true);
    expect(src.includes("LIVE")).toBe(true);
  });

  it("aborts LIVE unless ALLOW_STRIPE_LIVE=1", () => {
    expect(src.includes("ALLOW_STRIPE_LIVE")).toBe(true);
    expect(src.includes("process.exit(3)")).toBe(true);
    expect(src.includes("refuse: LIVE Stripe key detected")).toBe(true);
  });

  it("exits non-zero on missing secret path", () => {
    expect(src.includes("process.exit(2)") || src.includes("process.exit(1)")).toBe(true);
  });
});
