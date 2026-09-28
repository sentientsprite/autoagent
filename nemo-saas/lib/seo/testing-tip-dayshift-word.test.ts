import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const tip = (readFileSync(join(__dirname, "../../TESTING.md"), "utf8")
  .split("\n")
  .find((l) => l.startsWith("Tip at doc update:")) || "").toLowerCase();

describe("TESTING tip dayshift marker", () => {
  it("tip line mentions dayshift", () => {
    expect(tip.includes("dayshift")).toBe(true);
  });
});
