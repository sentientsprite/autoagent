import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "../..");
const beacon = readFileSync(join(root, "app/(marketing)/products/beacon/page.tsx"), "utf8");
const bloom = readFileSync(join(root, "app/(marketing)/products/bloom/page.tsx"), "utf8");
const echo = readFileSync(join(root, "app/(marketing)/products/echo/page.tsx"), "utf8");

describe("product price/SKU matrix", () => {
  it("Beacon advertises From $129/mo and Beacon SKU", () => {
    expect(beacon.includes("From $129/mo")).toBe(true);
    expect(beacon.includes("Beacon")).toBe(true);
  });
  it("Echo advertises $89/mo and Echo SKU", () => {
    expect(echo.includes("$89/mo")).toBe(true);
    expect(echo.includes("Echo")).toBe(true);
  });
  it("Bloom page is present with Bloom SKU (price may vary)", () => {
    expect(bloom.includes("Bloom")).toBe(true);
    expect(bloom.includes("priceLine=")).toBe(true);
  });
});
