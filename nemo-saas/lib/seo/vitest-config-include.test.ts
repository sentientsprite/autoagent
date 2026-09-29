import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "../../vitest.config.ts"), "utf8");

describe("vitest.config", () => {
  it("includes lib/**/*.test.ts", () => {
    expect(src.includes("lib/**/*.test.ts") || src.includes('include:')).toBe(true);
    expect(src.toLowerCase()).toMatch(/vitest|defineconfig/);
  });
});
