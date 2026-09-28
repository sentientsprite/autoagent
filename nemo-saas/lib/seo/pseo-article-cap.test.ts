import { describe, expect, it } from "vitest";
import { PUBLIC_ARTICLE_PATHS } from "./public-paths";
import { readdirSync, statSync } from "node:fs";
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
const fsArticles = [
  ...articlePages(join(root, "app/(marketing)/ut")),
  ...articlePages(join(root, "app/(marketing)/id")),
];

describe("pSEO article cap (no #11)", () => {
  it("PUBLIC_ARTICLE_PATHS stays at 10", () => {
    expect(PUBLIC_ARTICLE_PATHS.length).toBe(10);
  });
  it("filesystem shipping articles stay at 10", () => {
    expect(fsArticles.length).toBe(10);
  });
});
