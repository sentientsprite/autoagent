import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const file = join(__dirname, "../../app/(marketing)/_components/SalesPerksSection.tsx");

describe("SalesPerksSection", () => {
  it("exists and exports a component", () => {
    expect(existsSync(file)).toBe(true);
    const src = readFileSync(file, "utf8");
    expect(src.includes("export function SalesPerksSection") || src.includes("export default")).toBe(true);
  });
});
