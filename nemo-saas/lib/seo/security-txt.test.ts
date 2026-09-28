import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(
  join(__dirname, "../../app/.well-known/security.txt/route.ts"),
  "utf8",
);

describe("security.txt route", () => {
  it("declares Contact Canonical Expires and plain text", () => {
    expect(src.includes("Contact:")).toBe(true);
    expect(src.includes("Canonical:")).toBe(true);
    expect(src.includes("Expires:")).toBe(true);
    expect(src.includes("text/plain")).toBe(true);
    expect(src.includes("security/advisories")).toBe(true);
  });

  it("Expires stays in the future past overnight window", () => {
    const m = src.match(/Expires:\s*([^"\n]+)/);
    expect(m).toBeTruthy();
    const expires = Date.parse(m![1]!.replace(/",?$/, "").trim());
    expect(Number.isFinite(expires)).toBe(true);
    // must be after 2026-09-28 06:00 MDT (= 12:00Z)
    expect(expires).toBeGreaterThan(Date.parse("2026-09-28T12:00:00.000Z"));
  });

  it("Expires year is at least 2026", () => {
    const src = readFileSync(join(__dirname, "../../app/.well-known/security.txt/route.ts"), "utf8");
    expect(/Expires:\s*202[6-9]/.test(src) || /Expires:\s*20[3-9]/.test(src)).toBe(true);
  });


  it("Canonical points at well-known security.txt", () => {
    expect(src.includes(".well-known/security.txt")).toBe(true);
  });

});
