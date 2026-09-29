import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "../../app/robots.ts"), "utf8");

describe("robots.ts private disallow", () => {
  it("disallows api team hq billing", () => {
    for (const d of ["/api/", "/team", "/hq/", "/billing/"]) {
      expect(src.includes(`"${d}"`), d).toBe(true);
    }
  });

  it("allows root and points sitemap at PUBLIC_BASE", () => {
    expect(src.includes('allow: "/"')).toBe(true);
    expect(src.includes("sitemap:")).toBe(true);
    expect(src.includes("PUBLIC_BASE")).toBe(true);
  });
});
