import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "../../app/(marketing)");

describe("homepage marketing sections", () => {
  it("ships LvsProcessSection and OwnedDemandPanel modules", () => {
    expect(existsSync(join(root, "LvsProcessSection.tsx"))).toBe(true);
    expect(existsSync(join(root, "OwnedDemandPanel.tsx"))).toBe(true);
  });
});
