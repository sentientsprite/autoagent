import { describe, expect, it } from "vitest";
import {
  PUBLIC_ARTICLE_PATHS,
  PUBLIC_BASE,
  PUBLIC_SITEMAP_PATHS,
} from "./public-paths";

describe("public-paths exports", () => {
  it("PUBLIC_BASE is https nemo alias host", () => {
    expect(PUBLIC_BASE.startsWith("https://")).toBe(true);
    expect(PUBLIC_BASE.includes("nemo")).toBe(true);
  });

  it("sitemap paths include hubs portal home and all articles", () => {
    const sitemap = PUBLIC_SITEMAP_PATHS as readonly string[];
    for (const p of ["/", "/portal", "/ut", "/id", ...PUBLIC_ARTICLE_PATHS]) {
      expect(sitemap.includes(p), p).toBe(true);
    }
  });

  it("article paths are unique", () => {
    expect(new Set(PUBLIC_ARTICLE_PATHS).size).toBe(PUBLIC_ARTICLE_PATHS.length);
  });
});
