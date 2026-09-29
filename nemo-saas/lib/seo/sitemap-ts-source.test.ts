import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "../../app/sitemap.ts"), "utf8");

describe("app/sitemap.ts", () => {
  it("builds from PUBLIC_SITEMAP_PATHS / PUBLIC_BASE", () => {
    expect(src.includes("PUBLIC_SITEMAP_PATHS")).toBe(true);
    expect(src.includes("PUBLIC_BASE")).toBe(true);
  });
});
