import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "../..");
const files = [
  "app/(marketing)/page.tsx",
  "app/(marketing)/portal/page.tsx",
  "app/(marketing)/ut/page.tsx",
  "app/(marketing)/id/page.tsx",
];

describe("hubs/home/portal stay indexable", () => {
  it("do not set robots noindex in page modules", () => {
    for (const f of files) {
      const src = readFileSync(join(root, f), "utf8");
      expect(/noindex/i.test(src), f).toBe(false);
    }
  });
});
