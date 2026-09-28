import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "./pseo-metadata.ts"), "utf8");

describe("pseo-metadata.ts source", () => {
  it("imports PUBLIC_BASE and sets twitter card summary", () => {
    expect(src.includes("PUBLIC_BASE")).toBe(true);
    expect(src.includes('card: "summary"') || src.includes("card: 'summary'")).toBe(true);
    expect(src.includes('type: "article"') || src.includes("type: 'article'")).toBe(true);
    expect(src.includes('type: "website"') || src.includes("type: 'website'")).toBe(true);
  });
});
