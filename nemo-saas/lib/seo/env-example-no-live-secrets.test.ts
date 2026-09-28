import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "../../.env.example"), "utf8");

describe(".env.example secret hygiene", () => {
  it("does not assign sk_live_/pk_live_/rk_live_ values", () => {
    for (const line of src.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      expect(/^(SK|PK|RK).*LIVE/i.test(trimmed.split("=")[0] || "")).toBe(false);
      expect(/=.*(sk_live_|pk_live_|rk_live_)/.test(trimmed)).toBe(false);
    }
  });

  it("documents Stripe via STRIPE_SECRET_KEY placeholder (not a live secret)", () => {
    expect(src.includes("STRIPE_SECRET_KEY")).toBe(true);
    expect(/STRIPE_SECRET_KEY=\s*sk_live_/.test(src)).toBe(false);
  });
});
