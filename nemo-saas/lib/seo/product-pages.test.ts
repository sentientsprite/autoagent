import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "../../app/(marketing)/products");

describe("product pages metadata", () => {
  it("each SKU page uses hubMetadata with matching path", () => {
    for (const sku of ["beacon", "bloom", "echo"]) {
      const src = readFileSync(join(root, sku, "page.tsx"), "utf8");
      expect(src.includes("hubMetadata"), sku).toBe(true);
      expect(src.includes(`path: "/products/${sku}"`), sku).toBe(true);
      expect(src.includes("ProductChrome"), sku).toBe(true);
      expect(src.includes("priceLine"), sku).toBe(true);
    }
  });

  it("Beacon page titles GBP Autopilot", () => {
    const src = readFileSync(join(root, "beacon", "page.tsx"), "utf8");
    expect(src.includes("GBP Autopilot") || src.includes("Beacon")).toBe(true);
  });


  it("Echo and Bloom pages name their SKUs", () => {
    const echo = readFileSync(join(root, "echo", "page.tsx"), "utf8");
    const bloom = readFileSync(join(root, "bloom", "page.tsx"), "utf8");
    expect(echo.includes("Echo") || echo.includes("echo")).toBe(true);
    expect(bloom.includes("Bloom") || bloom.includes("bloom")).toBe(true);
  });


  it("Bloom Seasonal Content Engine title", () => {
    const src = readFileSync(join(root, "bloom", "page.tsx"), "utf8");
    expect(src.includes("Seasonal Content Engine")).toBe(true);
  });

  it("Echo page titles mention Echo", () => {
    const src = readFileSync(join(root, "echo", "page.tsx"), "utf8");
    expect(/Echo/i.test(src)).toBe(true);
  });


  it("Echo Review Flywheel title", () => {
    const src = readFileSync(join(root, "echo", "page.tsx"), "utf8");
    expect(src.includes("Review Flywheel")).toBe(true);
  });

  it("Echo priceLine is $89/mo", () => {
    const src = readFileSync(join(root, "echo", "page.tsx"), "utf8");
    expect(src.includes("$89/mo")).toBe(true);
  });

  it("Bloom priceLine is present", () => {
    const src = readFileSync(join(root, "bloom", "page.tsx"), "utf8");
    expect(/\$\d+\/mo/.test(src)).toBe(true);
  });


  it("Beacon From $129/mo priceLine", () => {
    const src = readFileSync(join(root, "beacon", "page.tsx"), "utf8");
    expect(src.includes("From $129/mo")).toBe(true);
  });

});
