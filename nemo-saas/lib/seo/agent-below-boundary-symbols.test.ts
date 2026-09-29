import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const agent = readFileSync(join(__dirname, "../../../agent.py"), "utf8");
const below = agent.slice(agent.indexOf("FIXED ADAPTER BOUNDARY"));

describe("agent below FIXED ADAPTER BOUNDARY", () => {
  it("still defines to_atif and AutoAgent Harbor adapter", () => {
    expect(below.includes("def to_atif")).toBe(true);
    expect(below.includes("class AutoAgent") || below.includes("AutoAgent")).toBe(true);
  });
});
