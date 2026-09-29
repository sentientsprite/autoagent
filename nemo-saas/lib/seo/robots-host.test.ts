import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "../../app/robots.ts"), "utf8");

describe("robots host", () => {
  it("sets host from PUBLIC_BASE", () => {
    expect(src.includes("host:")).toBe(true);
    expect(src.includes("PUBLIC_BASE")).toBe(true);
  });
});
