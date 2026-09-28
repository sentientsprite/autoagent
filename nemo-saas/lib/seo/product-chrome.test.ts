import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(
  join(__dirname, "../../app/(marketing)/products/ProductChrome.tsx"),
  "utf8",
);

describe("ProductChrome", () => {
  it("renders h1 from title prop", () => {
    expect(src.includes("<h1")).toBe(true);
    expect(src.includes("{title}")).toBe(true);
  });

  it("links Local Visibility Score to home", () => {
    expect(src.includes("Local Visibility Score")).toBe(true);
    expect(src.includes('href="/"')).toBe(true);
  });
});
