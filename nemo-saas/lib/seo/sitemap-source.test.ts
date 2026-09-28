import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "../../app/sitemap.ts"), "utf8");

describe("sitemap.ts", () => {
  it("builds locs from PUBLIC_BASE and PUBLIC_SITEMAP_PATHS", () => {
    expect(src.includes("PUBLIC_BASE")).toBe(true);
    expect(src.includes("PUBLIC_SITEMAP_PATHS")).toBe(true);
  });
});
