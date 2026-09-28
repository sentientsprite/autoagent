import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(
  join(__dirname, "../../app/(marketing)/_components/PseoArticle.tsx"),
  "utf8",
);

describe("PseoArticle JSON-LD builders", () => {
  it("emits Article headline FAQPage and BreadcrumbList", () => {
    expect(src.includes('"@type": "Article"') || src.includes("'@type': 'Article'") || src.includes('@type": "Article"')).toBe(true);
    expect(src.includes("headline:")).toBe(true);
    expect(src.includes("FAQPage")).toBe(true);
    expect(src.includes("BreadcrumbList")).toBe(true);
    expect(src.includes("Nemo Local")).toBe(true);
    expect(src.includes("More guides")).toBe(true);
    expect(src.includes("Local Visibility Score")).toBe(true);
    expect(/author/i.test(src)).toBe(true);
    expect(src.includes("Question")).toBe(true);
    expect(src.includes("publisher")).toBe(true);
  });
});

