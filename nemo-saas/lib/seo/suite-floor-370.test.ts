import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const tip = readFileSync(join(__dirname, "../../TESTING.md"), "utf8")
  .split("\n")
  .find((l) => l.startsWith("Tip at doc update:")) || "";

describe("suite floor 370", () => {
  it("TESTING tip reports tests >= 370", () => {
    const m = tip.match(/tests (\d+)/);
    expect(m).toBeTruthy();
    expect(Number(m![1])).toBeGreaterThanOrEqual(370);
  });
});
