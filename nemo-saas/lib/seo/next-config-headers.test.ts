import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "../../next.config.mjs"), "utf8");

describe("next.config.mjs security headers", () => {
  it("sets nosniff DENY referrer permissions", () => {
    expect(src.includes("X-Content-Type-Options")).toBe(true);
    expect(src.includes("nosniff")).toBe(true);
    expect(src.includes("X-Frame-Options")).toBe(true);
    expect(src.includes("DENY")).toBe(true);
    expect(src.includes("Referrer-Policy")).toBe(true);
    expect(src.includes("Permissions-Policy")).toBe(true);
    expect(src.includes("camera=()")).toBe(true);
    expect(src.includes("geolocation=()")).toBe(true);
  });
});
