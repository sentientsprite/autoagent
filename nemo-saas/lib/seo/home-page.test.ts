import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const home = readFileSync(join(__dirname, "../../app/(marketing)/page.tsx"), "utf8");

describe("marketing homepage", () => {
  it("wires HomeClient or Local Visibility Score", () => {
    expect(home.includes("HomeClient") || /Local Visibility/i.test(home)).toBe(true);
  });
});
