import { describe, expect, it } from "vitest";
import { readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

function countArticles(dir: string): number {
  if (!existsSync(dir)) return 0;
  let n = 0;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) n += countArticles(p);
    else if (name === "page.tsx" && (dir.includes("/ut/") || dir.includes("/id/"))) n += 1;
  }
  return n;
}

const marketing = join(__dirname, "../../app/(marketing)");

describe("no pSEO #11", () => {
  it("filesystem article count stays at 10", () => {
    expect(countArticles(join(marketing, "ut")) + countArticles(join(marketing, "id"))).toBe(10);
  });
});
