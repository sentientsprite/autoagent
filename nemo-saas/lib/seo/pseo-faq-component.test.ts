import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "../../app/(marketing)/_components/PseoArticle.tsx"), "utf8");

describe("PseoFaqJsonLd component", () => {
  it("emits FAQPage JSON-LD from faqs prop", () => {
    expect(src.includes("export function PseoFaqJsonLd")).toBe(true);
    expect(src.includes('"@type": "FAQPage"') || src.includes("'@type': 'FAQPage'") || src.includes('@type": "FAQPage"')).toBe(true);
    expect(src.includes("mainEntity")).toBe(true);
  });
});
