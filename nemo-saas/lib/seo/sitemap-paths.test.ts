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

});
