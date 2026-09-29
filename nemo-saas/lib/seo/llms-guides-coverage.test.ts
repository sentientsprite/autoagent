import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PUBLIC_ARTICLE_PATHS, PUBLIC_BASE } from "./public-paths";

const llms = readFileSync(join(__dirname, "../../public/llms.txt"), "utf8");

describe("llms.txt guide coverage", () => {
  it("lists every PUBLIC_ARTICLE_PATH under Guides", () => {
    for (const p of PUBLIC_ARTICLE_PATHS) {
      expect(llms.includes(`${PUBLIC_BASE}${p}`), p).toBe(true);
    }
  });

  it("names Utah and Idaho hubs", () => {
    expect(llms.includes(`${PUBLIC_BASE}/ut`)).toBe(true);
    expect(llms.includes(`${PUBLIC_BASE}/id`)).toBe(true);
  });
});
