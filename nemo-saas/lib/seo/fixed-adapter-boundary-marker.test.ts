import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const agent = readFileSync(join(__dirname, "../../../agent.py"), "utf8");

describe("FIXED ADAPTER BOUNDARY marker", () => {
  it("agent.py still has the boundary comment for Harbor edits", () => {
    expect(agent.includes("FIXED ADAPTER BOUNDARY")).toBe(true);
    expect(agent.includes("do not modify unless the human explicitly asks")).toBe(true);
    const idx = agent.indexOf("FIXED ADAPTER BOUNDARY");
    expect(idx).toBeGreaterThan(50);
  });
});
