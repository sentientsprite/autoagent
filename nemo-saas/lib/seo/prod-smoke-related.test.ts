import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const smoke = readFileSync(join(__dirname, "../../scripts/prod-smoke.mjs"), "utf8");

describe("prod-smoke related samples", () => {
  it("checks related hrefs from at least three articles", () => {
    expect(smoke.includes("RELATED_SAMPLES")).toBe(true);
    expect(smoke.includes("/ut/salt-lake-city/plumber-google-maps-visibility")).toBe(true);
    expect(smoke.includes("/id/boise/concrete-sealing-google-maps")).toBe(true);
    expect(smoke.includes("/ut/ogden/roofer-google-review-replies")).toBe(true);
  });
});
