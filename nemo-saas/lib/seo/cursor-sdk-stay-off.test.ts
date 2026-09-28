import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const agentMap = join(__dirname, "../../../docs/agent-map.md");

describe("CURSOR_SDK stay-off", () => {
  it("agent-map documents CURSOR_SDK_ENABLED=0 default for mini bots", () => {
    expect(existsSync(agentMap)).toBe(true);
    const src = readFileSync(agentMap, "utf8");
    expect(src.includes("CURSOR_SDK_ENABLED=0")).toBe(true);
  });
});
