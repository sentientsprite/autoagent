import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const smoke = readFileSync(join(__dirname, "../../scripts/prod-smoke.mjs"), "utf8");

describe("prod-smoke guard inventory", () => {
  it("covers headers schema private products and robots", () => {
    for (const needle of [
      "x-content-type-options",
      "FAQPage",
      "og:title",
      "twitter:card",
      "BreadcrumbList",
      "More guides",
      "permissions-policy",
      "/.well-known/security.txt",
      "noindex",
      "Disallow: /api/",
      "/products/beacon",
      "html-lang",
      "viewport",
    ]) {
      expect(smoke.includes(needle), needle).toBe(true);
    }
  });
});
