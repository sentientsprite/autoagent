import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const smoke = readFileSync(join(__dirname, "../../scripts/prod-smoke.mjs"), "utf8");

describe("prod-smoke REQUIRED_HEADERS", () => {
  it("checks nosniff DENY and referrer-policy", () => {
    expect(smoke.includes("x-content-type-options")).toBe(true);
    expect(smoke.includes("nosniff")).toBe(true);
    expect(smoke.includes("x-frame-options")).toBe(true);
    expect(smoke.includes("DENY")).toBe(true);
    expect(smoke.includes("referrer-policy")).toBe(true);
  });
});
