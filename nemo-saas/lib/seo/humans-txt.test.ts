import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "../../public/humans.txt"), "utf8");

describe("humans.txt", () => {
  it("declares TEAM and SITE blocks with Next.js + LVS", () => {
    expect(src.includes("/* TEAM */")).toBe(true);
    expect(src.includes("/* SITE */")).toBe(true);
    expect(src.includes("Next.js")).toBe(true);
    expect(src.includes("Local Visibility Score")).toBe(true);
  });
});
