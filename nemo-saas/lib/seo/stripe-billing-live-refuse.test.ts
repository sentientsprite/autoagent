import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "../billing/stripe.ts"), "utf8");

describe("billing stripe LIVE refuse parity", () => {
  it("exports live-secret detection and ALLOW_STRIPE_LIVE gate", () => {
    expect(src.includes("isStripeLiveSecret")).toBe(true);
    expect(src.includes("stripeLiveAllowed")).toBe(true);
    expect(src.includes("ALLOW_STRIPE_LIVE")).toBe(true);
    expect(src.includes('startsWith("sk_live")') || src.includes("startsWith('sk_live')")).toBe(true);
  });
});
