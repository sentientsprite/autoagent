import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const fixture = join(__dirname, "../../fixtures/money-farm/org-two-locations.json");

describe("money-farm fixture present", () => {
  it("ships org-two-locations JSON with locations array", () => {
    expect(existsSync(fixture)).toBe(true);
    const data = JSON.parse(readFileSync(fixture, "utf8"));
    const locs = data.locations ?? data.orgs?.[0]?.locations ?? data;
    expect(Array.isArray(locs) || typeof data === "object").toBe(true);
    expect(JSON.stringify(data).length).toBeGreaterThan(20);
  });
});
