import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function articlePages(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...articlePages(p));
    else if (name === "page.tsx" && !dir.endsWith("/ut") && !dir.endsWith("/id")) {
      // only city/topic articles under ut/* and id/*
      if (dir.includes("/ut/") || dir.includes("/id/")) out.push(p);
    }
  }
  return out;
}

const root = join(__dirname, "../..");
const pages = [
  ...articlePages(join(root, "app/(marketing)/ut")),
  ...articlePages(join(root, "app/(marketing)/id")),
];

describe("article FAQ floor", () => {
  it("has exactly 10 shipping articles", () => {
    expect(pages.length).toBe(10);
  });

  it("each article mounts PseoFaqJsonLd with at least 3 FAQs", () => {
    for (const p of pages) {
      const src = readFileSync(p, "utf8");
      expect(src.includes("PseoFaqJsonLd"), p).toBe(true);
      const qs = (src.match(/\{\s*q:/g) || []).length;
      expect(qs, p).toBeGreaterThanOrEqual(3);
    }
  });
});
