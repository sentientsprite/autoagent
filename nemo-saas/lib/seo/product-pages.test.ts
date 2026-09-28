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
});
