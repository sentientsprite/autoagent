import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { PUBLIC_ARTICLE_PATHS } from "./public-paths";

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
const pages = [
  ...articlePages(join(root, "app/(marketing)/ut")),
  ...articlePages(join(root, "app/(marketing)/id")),
];

describe("article related-guides diversity", () => {
  it("every article declares a related prop with ≥2 hrefs into PUBLIC_ARTICLE_PATHS", () => {
    const publicSet = new Set(PUBLIC_ARTICLE_PATHS);
    for (const p of pages) {
      const src = readFileSync(p, "utf8");
      expect(src.includes("related={"), p).toBe(true);
      const hrefs = [...src.matchAll(/href:\s*"(\/[^"]+)"/g)].map((m) => m[1]);
      // related block hrefs only — filter to article paths
      const articleHrefs = hrefs.filter((h) => publicSet.has(h));
      expect(articleHrefs.length, p).toBeGreaterThanOrEqual(2);
      // no self-link to own path if we can infer it
      const rel = p.split("app/(marketing)")[1]?.replace(/\/page\.tsx$/, "") || "";
      if (rel) {
        expect(articleHrefs.includes(rel), `${p} self-related`).toBe(false);
      }
    }
  });
});
