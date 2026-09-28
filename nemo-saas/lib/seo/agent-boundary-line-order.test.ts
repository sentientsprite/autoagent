import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const agent = readFileSync(join(__dirname, "../../../agent.py"), "utf8");

describe("agent SYSTEM_PROMPT above BOUNDARY", () => {
  it("SYSTEM_PROMPT appears before FIXED ADAPTER BOUNDARY", () => {
    const promptIdx = agent.indexOf("SYSTEM_PROMPT");
    const boundaryIdx = agent.indexOf("FIXED ADAPTER BOUNDARY");
    expect(promptIdx).toBeGreaterThanOrEqual(0);
    expect(boundaryIdx).toBeGreaterThan(promptIdx);
  });
});
