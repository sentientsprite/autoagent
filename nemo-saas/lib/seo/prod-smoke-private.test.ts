import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const smoke = readFileSync(join(__dirname, "../../scripts/prod-smoke.mjs"), "utf8");

describe("prod-smoke private noindex routes", () => {
  it("covers team billing/success and hq/locations", () => {
    for (const path of ["/team", "/billing/success", "/hq/locations"]) {
      expect(smoke.includes(`"${path}"`), path).toBe(true);
    }
  });
});
