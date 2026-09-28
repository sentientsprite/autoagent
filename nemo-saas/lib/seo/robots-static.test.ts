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
  });
});
