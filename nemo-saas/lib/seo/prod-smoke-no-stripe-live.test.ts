import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "../../scripts/prod-smoke.mjs"), "utf8");

describe("prod-smoke.mjs Stripe hygiene", () => {
  it("has no sk_live_/pk_live_ secret values", () => {
    expect(/sk_live_[A-Za-z0-9]+/.test(src)).toBe(false);
    expect(/pk_live_[A-Za-z0-9]+/.test(src)).toBe(false);
  });
});
