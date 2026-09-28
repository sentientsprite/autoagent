import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const layout = readFileSync(join(__dirname, "../../app/(marketing)/layout.tsx"), "utf8");

describe("marketing primary nav", () => {
  it("links portal ut id products and home score", () => {
    for (const href of [
      "/portal",
      "/ut",
      "/id",
      "/products/beacon",
      "/products/echo",
      "/products/bloom",
      "/",
    ]) {
      expect(layout.includes(`href="${href}"`) || layout.includes(`href={'${href}'}`), href).toBe(true);
    }
  });

  it("labels Utah and Idaho guide links", () => {
    expect(layout.includes("Utah guides")).toBe(true);
    expect(layout.includes("Idaho guides")).toBe(true);
  });


  it("exposes team link in header", () => {
    expect(layout.includes('href="/team"')).toBe(true);
  });


  it("labels Full score CTA", () => {
    expect(layout.includes("Full score")).toBe(true);
  });


  it("brands header NEMO LOCAL", () => {
    expect(layout.includes("NEMO LOCAL")).toBe(true);
  });

});
