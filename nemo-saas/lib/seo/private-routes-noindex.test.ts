import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "../..");

describe("private marketing routes stay noindex", () => {
  for (const rel of [
    "app/(marketing)/team/page.tsx",
    "app/(marketing)/billing/success/page.tsx",
    "app/(marketing)/hq/locations/page.tsx",
  ]) {
    it(`${rel} sets robots index false`, () => {
      const src = readFileSync(join(root, rel), "utf8");
      expect(src.includes("index: false")).toBe(true);
      expect(src.includes("follow: false")).toBe(true);
    });
  }
});
