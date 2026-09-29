import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
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

const pages = [
  ...articlePages(join(__dirname, "../../app/(marketing)/ut")),
  ...articlePages(join(__dirname, "../../app/(marketing)/id")),
];

describe("FAQ floor still green afternoon", () => {
  it("10 articles still mount PseoFaqJsonLd", () => {
    expect(pages.length).toBe(10);
    for (const p of pages) {
      expect(readFileSync(p, "utf8").includes("PseoFaqJsonLd"), p).toBe(true);
    }
  });
});
