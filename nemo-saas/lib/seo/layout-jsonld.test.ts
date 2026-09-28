import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const layout = readFileSync(join(__dirname, "../../app/(marketing)/layout.tsx"), "utf8");

describe("marketing layout JSON-LD", () => {
  it("emits Organization and WebSite types", () => {
    expect(layout.includes("Organization")).toBe(true);
    expect(layout.includes("WebSite")).toBe(true);
  });

  it("labels primary nav for a11y", () => {
    expect(layout.includes("aria-label=\"Primary\"")).toBe(true);
  });

  it("uses PUBLIC_BASE for Organization/WebSite url", () => {
    expect(layout.includes("PUBLIC_BASE")).toBe(true);
    expect(layout.includes("url: PUBLIC_BASE")).toBe(true);
  });
});
