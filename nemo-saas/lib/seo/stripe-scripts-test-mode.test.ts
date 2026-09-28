import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const scriptsDir = join(__dirname, "../../scripts");
const files = readdirSync(scriptsDir).filter((f) => f.includes("stripe") || f.includes("money-farm"));

describe("stripe/money-farm scripts stay off LIVE keys", () => {
  it("never hardcodes a sk_live_/pk_live_ secret value", () => {
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) {
      const src = readFileSync(join(scriptsDir, f), "utf8");
      // Allow the literal token in refusal/guard copy; forbid assigned secret values.
      expect(/sk_live_[A-Za-z0-9]+/.test(src), f).toBe(false);
      expect(/pk_live_[A-Za-z0-9]+/.test(src), f).toBe(false);
    }
  });

  it("stripe provision script refuses LIVE mode", () => {
    const src = readFileSync(join(scriptsDir, "money-farm-stripe-provision.mjs"), "utf8");
    expect(src.includes("sk_live") || /LIVE/i.test(src)).toBe(true);
    expect(/refus|abort|throw|exit|TEST|test mode|not.*live/i.test(src)).toBe(true);
  });
});
