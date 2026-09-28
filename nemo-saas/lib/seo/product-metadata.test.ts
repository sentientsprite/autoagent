import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "../..");

describe("product page metadata", () => {
  for (const sku of ["beacon", "bloom", "echo"] as const) {
    it(`${sku} exports metadata title containing product name`, () => {
      const src = readFileSync(join(root, `app/(marketing)/products/${sku}/page.tsx`), "utf8");
      expect(src.includes("export const metadata") || src.includes("generateMetadata")).toBe(true);
      expect(new RegExp(sku, "i").test(src)).toBe(true);
      expect(src.includes("Nemo Local")).toBe(true);
    });
  }
});
