import { describe, expect, it } from "vitest";
import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

import { PUBLIC_ARTICLE_PATHS, PUBLIC_HUB_PATHS, PUBLIC_SITEMAP_PATHS } from "./public-paths";

const marketingRoot = join(__dirname, "../../app/(marketing)");

function listArticleRoutes(): string[] {
  const out: string[] = [];
  for (const state of ["ut", "id"]) {
    const stateDir = join(marketingRoot, state);
    if (!existsSync(stateDir)) continue;
    for (const city of readdirSync(stateDir, { withFileTypes: true })) {
      if (!city.isDirectory()) continue;
      const cityDir = join(stateDir, city.name);
      for (const slug of readdirSync(cityDir, { withFileTypes: true })) {
        if (!slug.isDirectory()) continue;
        if (existsSync(join(cityDir, slug.name, "page.tsx"))) {
          out.push(`/${state}/${city.name}/${slug.name}`);
        }
      }
    }
  }
  return out.sort();
}

describe("sitemap article paths", () => {
  it("lists every filesystem ut/id article", () => {
    expect([...PUBLIC_ARTICLE_PATHS].sort()).toEqual(listArticleRoutes());
  });

  it("every sitemap article has a page.tsx", () => {
    for (const path of PUBLIC_ARTICLE_PATHS) {
      const file = join(marketingRoot, path.slice(1), "page.tsx");
      expect(existsSync(file), `missing ${file}`).toBe(true);
    }
  });

  it("stays at exactly ten articles overnight (pSEO #11 out of scope)", () => {
    expect(PUBLIC_ARTICLE_PATHS.length).toBe(10);
  });


  it("PUBLIC_SITEMAP_PATHS is hubs+articles (17)", () => {
    expect(PUBLIC_SITEMAP_PATHS.length).toBe(17);
  });


  it("PUBLIC_HUB_PATHS has seven hub/product routes", () => {
    expect(PUBLIC_HUB_PATHS.length).toBe(7);
  });

  it("articles live only under /ut or /id", () => {
    for (const path of PUBLIC_ARTICLE_PATHS) {
      expect(path.startsWith("/ut/") || path.startsWith("/id/"), path).toBe(true);
    }
  });

  it("PUBLIC_HUB_PATHS exact set", () => {
    expect([...PUBLIC_HUB_PATHS]).toEqual([
      "/",
      "/portal",
      "/products/beacon",
      "/products/bloom",
      "/products/echo",
      "/ut",
      "/id",
    ]);
  });


  it("includes Boise and Ogden articles", () => {
    expect(PUBLIC_ARTICLE_PATHS.some((p) => p.includes("/boise/"))).toBe(true);
    expect(PUBLIC_ARTICLE_PATHS.some((p) => p.includes("/ogden/"))).toBe(true);
  });


  it("article paths are unique", () => {
    expect(new Set(PUBLIC_ARTICLE_PATHS).size).toBe(PUBLIC_ARTICLE_PATHS.length);
  });


  it("hub paths are unique", () => {
    expect(new Set(PUBLIC_HUB_PATHS).size).toBe(PUBLIC_HUB_PATHS.length);
  });


  it("includes Provo and Orem articles", () => {
    expect(PUBLIC_ARTICLE_PATHS.some((p) => p.includes("/provo/"))).toBe(true);
    expect(PUBLIC_ARTICLE_PATHS.some((p) => p.includes("/orem/"))).toBe(true);
  });


  it("Salt Lake City article count is at least five", () => {
    const slc = PUBLIC_ARTICLE_PATHS.filter((p) => p.includes("/salt-lake-city/"));
    expect(slc.length).toBeGreaterThanOrEqual(5);
  });


  it("exactly one Idaho article overnight", () => {
    expect(PUBLIC_ARTICLE_PATHS.filter((p) => p.startsWith("/id/")).length).toBe(1);
  });


  it("exactly nine Utah articles overnight", () => {
    expect(PUBLIC_ARTICLE_PATHS.filter((p) => p.startsWith("/ut/")).length).toBe(9);
  });


  it("sitemap paths are unique", () => {
    expect(new Set(PUBLIC_SITEMAP_PATHS).size).toBe(PUBLIC_SITEMAP_PATHS.length);
  });


  it("locks plumber guide path", () => {
    expect(PUBLIC_ARTICLE_PATHS).toContain("/ut/salt-lake-city/plumber-google-maps-visibility");
  });


  it("locks boise concrete guide path", () => {
    expect(PUBLIC_ARTICLE_PATHS).toContain("/id/boise/concrete-sealing-google-maps");
  });

});
