import { describe, expect, it } from "vitest";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const dir = join(__dirname);

describe("seo vitest file floor", () => {
  it("lib/seo has at least 120 *.test.ts files", () => {
    const n = readdirSync(dir).filter((f) => f.endsWith(".test.ts")).length;
    expect(n).toBeGreaterThanOrEqual(120);
  });
});
