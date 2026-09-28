import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "./public-paths.ts"), "utf8");

describe("public-paths franchise hygiene", () => {
  it("does not mention franchise", () => {
    expect(/franchise/i.test(src)).toBe(false);
  });
});
