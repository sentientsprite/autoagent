import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const scripts = join(__dirname, "../../scripts");

describe("money-farm scripts present", () => {
  it("ships p0 dry-run, hq smoke, stripe provision, prod-smoke", () => {
    for (const f of [
      "money-farm-p0-dry-run.mjs",
      "money-farm-hq-smoke.mjs",
      "money-farm-stripe-provision.mjs",
      "prod-smoke.mjs",
    ]) {
      expect(existsSync(join(scripts, f)), f).toBe(true);
    }
  });

  it("prod-smoke mentions FAQPage guard string", () => {
    const src = readFileSync(join(scripts, "prod-smoke.mjs"), "utf8");
    expect(src.includes("FAQPage")).toBe(true);
  });
});
