import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ut = join(__dirname, "../../app/(marketing)/ut/page.tsx");
const id = join(__dirname, "../../app/(marketing)/id/page.tsx");

describe("hubs still indexable afternoon", () => {
  it("UT/ID hubs exist and are not noindex", () => {
    expect(existsSync(ut)).toBe(true);
    expect(existsSync(id)).toBe(true);
    for (const p of [ut, id]) {
      const src = readFileSync(p, "utf8");
      expect(/noindex/i.test(src)).toBe(false);
    }
  });
});
