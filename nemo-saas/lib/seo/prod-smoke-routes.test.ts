import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PUBLIC_ARTICLE_PATHS, PUBLIC_HUB_PATHS } from "./public-paths";

const smoke = readFileSync(join(__dirname, "../../scripts/prod-smoke.mjs"), "utf8");

describe("prod-smoke ROUTES coverage", () => {
  it("lists every PUBLIC_ARTICLE_PATH", () => {
    for (const path of PUBLIC_ARTICLE_PATHS) {
      expect(smoke.includes(`"${path}"`) || smoke.includes(`'${path}'`), path).toBe(true);
    }
  });

  it("lists every PUBLIC_HUB_PATH", () => {
    for (const path of PUBLIC_HUB_PATHS) {
      // homepage appears as "/" in ROUTES
      expect(smoke.includes(`"${path}"`) || smoke.includes(`'${path}'`), path).toBe(true);
    }
  });

  it("ROUTES includes static SEO assets", () => {
    for (const path of [
      "/robots.txt",
      "/sitemap.xml",
      "/llms.txt",
      "/humans.txt",
      "/site.webmanifest",
      "/.well-known/security.txt",
    ]) {
      expect(smoke.includes(`"${path}"`), path).toBe(true);
    }
  });


  it("ROUTES has at least twenty entries", () => {
    const m = smoke.match(/const ROUTES = \[([\s\S]*?)\];/);
    expect(m).toBeTruthy();
    const count = (m![1].match(/"[^"]+"/g) || []).length;
    expect(count).toBeGreaterThanOrEqual(20);
  });


  it("ROUTES has exactly twenty-three entries", () => {
    const m = smoke.match(/const ROUTES = \[([\s\S]*?)\];/);
    expect(m).toBeTruthy();
    const count = (m![1].match(/"[^"]+"/g) || []).length;
    expect(count).toBe(23);
  });

});
