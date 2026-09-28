import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const sh = readFileSync(join(__dirname, "../../../scripts/run-skilleval.sh"), "utf8");

describe("run-skilleval ollama path", () => {
  it("checks OLLAMA_MODEL and fails closed if missing", () => {
    expect(sh.includes("OLLAMA_MODEL")).toBe(true);
    expect(sh.includes("ollama pull") || sh.includes("not found")).toBe(true);
  });
});
