import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "../..");

describe("public SEO static assets", () => {
  it("ships llms.txt humans.txt and webmanifest", () => {
    for (const f of ["public/llms.txt", "public/humans.txt", "public/site.webmanifest", "app/.well-known/security.txt/route.ts"]) {
      expect(existsSync(join(root, f)), f).toBe(true);
    }
  });

  it("robots route disallows private areas", () => {
    const src = readFileSync(join(root, "app/robots.ts"), "utf8");
    for (const d of ["/api/", "/team", "/hq/", "/billing/"]) {
      expect(src.includes(d), d).toBe(true);
    }
    expect(src.includes("sitemap")).toBe(true);
  });

  it("robots declares a userAgent rule", () => {
    const src = readFileSync(join(root, "app/robots.ts"), "utf8");
    expect(src.includes("userAgent") || src.includes("User-agent")).toBe(true);
  });


  it("robots declares host from PUBLIC_BASE", () => {
    const src = readFileSync(join(root, "app/robots.ts"), "utf8");
    expect(src.includes("PUBLIC_BASE")).toBe(true);
    expect(src.includes("host")).toBe(true);
  });

});
