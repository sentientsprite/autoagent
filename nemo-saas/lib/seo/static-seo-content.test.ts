import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PUBLIC_ARTICLE_PATHS } from "./public-paths";

const root = join(__dirname, "../..");
const llms = readFileSync(join(root, "public/llms.txt"), "utf8");
const humans = readFileSync(join(root, "public/humans.txt"), "utf8");
const manifest = readFileSync(join(root, "public/site.webmanifest"), "utf8");

describe("static SEO content files", () => {
  it("llms.txt points at hubs portal and sitemap", () => {
    expect(llms.includes("/portal")).toBe(true);
    expect(llms.includes("/ut")).toBe(true);
    expect(llms.includes("/id")).toBe(true);
    expect(llms.includes("sitemap.xml")).toBe(true);
    expect(llms.includes("Nemo Local")).toBe(true);
    expect(llms.includes("## Guides")).toBe(true);
    expect(llms.includes("/ut/salt-lake-city/plumber-google-maps-visibility")).toBe(true);
  });

  it("humans.txt names Nemo Local site", () => {
    expect(humans.includes("Nemo Local") || humans.includes("nemo-app-v-1")).toBe(true);
    expect(humans.includes("Next.js")).toBe(true);
  });

  it("humans.txt declares TEAM and SITE sections", () => {
    expect(humans.includes("TEAM")).toBe(true);
    expect(humans.includes("SITE")).toBe(true);
  });

  it("webmanifest has name start_url and theme", () => {
    const j = JSON.parse(manifest);
    expect(j.name).toMatch(/Nemo/i);
    expect(j.start_url).toBe("/");
    expect(j.theme_color).toBeTruthy();
    expect(j.display || j.icons).toBeTruthy();
  });

  it("llms.txt lists every PUBLIC_ARTICLE_PATH", () => {
    for (const path of PUBLIC_ARTICLE_PATHS) {
      expect(llms.includes(path), path).toBe(true);
    }
  });

  it("llms.txt mentions product path prefix", () => {
    expect(llms.includes("/products/")).toBe(true);
  });

  it("llms.txt has Product section", () => {
    expect(llms.includes("## Product")).toBe(true);
  });


  it("humans.txt names a Builder", () => {
    expect(/Builder:/i.test(humans)).toBe(true);
  });

});
