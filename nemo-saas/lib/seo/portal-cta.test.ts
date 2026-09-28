import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const portal = readFileSync(join(__dirname, "../../app/(marketing)/portal/page.tsx"), "utf8");

describe("portal CTA copy", () => {
  it("mentions Local Visibility Score and product SKUs", () => {
    expect(portal.includes("Local Visibility Score")).toBe(true);
    expect(portal.includes("Beacon") || portal.includes("beacon")).toBe(true);
    expect(portal.includes("Echo") || portal.includes("echo")).toBe(true);
    expect(portal.includes("Bloom") || portal.includes("bloom")).toBe(true);
  });

  it("exports hubMetadata for /portal", () => {
    expect(portal.includes("hubMetadata")).toBe(true);
    expect(portal.includes('path: "/portal"')).toBe(true);
  });
});
