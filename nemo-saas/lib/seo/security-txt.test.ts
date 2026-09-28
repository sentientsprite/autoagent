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
});
