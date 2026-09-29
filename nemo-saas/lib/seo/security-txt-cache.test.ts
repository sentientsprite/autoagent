import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "../../app/.well-known/security.txt/route.ts"), "utf8");

describe("security.txt route cache", () => {
  it("sets public Cache-Control max-age", () => {
    expect(src.includes("Cache-Control")).toBe(true);
    expect(src.includes("max-age=")).toBe(true);
    expect(src.includes("text/plain")).toBe(true);
  });
});
