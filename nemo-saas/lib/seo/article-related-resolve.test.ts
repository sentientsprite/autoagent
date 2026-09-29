import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

function articlePages(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...articlePages(p));
    else if (name === "page.tsx" && (dir.includes("/ut/") || dir.includes("/id/"))) out.push(p);
  }
  return out;
}

const root = join(__dirname, "../..");
const marketing = join(root, "app/(marketing)");
const pages = [
  ...articlePages(join(marketing, "ut")),
  ...articlePages(join(marketing, "id")),
];

describe("article related hrefs resolve on disk", () => {
  it("every related article href has a page.tsx", () => {
    for (const p of pages) {
      const src = readFileSync(p, "utf8");
      const hrefs = [...src.matchAll(/href:\s*"(\/(?:ut|id)\/[^"]+)"/g)].map((m) => m[1]);
      for (const href of hrefs) {
        const target = join(marketing, href.slice(1), "page.tsx");
        expect(existsSync(target), `${p} → ${href}`).toBe(true);
      }
    }
  });
});
