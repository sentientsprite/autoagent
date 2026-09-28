import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const tip = readFileSync(join(__dirname, "../../TESTING.md"), "utf8")
  .split("\n")
  .find((l) => l.startsWith("Tip at doc update:")) || "";

describe("TESTING suite floor 359", () => {
  it("reports tests >= 359 after afternoon invents", () => {
    const m = tip.match(/tests (\d+)/);
    expect(m).toBeTruthy();
    expect(Number(m![1])).toBeGreaterThanOrEqual(359);
  });
});
