import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const layout = readFileSync(join(__dirname, "../../app/(marketing)/layout.tsx"), "utf8");

describe("marketing layout Organization JSON-LD", () => {
  it("declares Organization named Nemo Local with publisher", () => {
    expect(layout.includes('"@type": "Organization"') || layout.includes("'@type': 'Organization'") || layout.includes('@type": "Organization"')).toBe(true);
    expect(layout.includes("Nemo Local")).toBe(true);
    expect(layout.includes("publisher")).toBe(true);
  });
});
