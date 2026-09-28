import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const agent = readFileSync(join(__dirname, "../../../agent.py"), "utf8");
const editable = agent.slice(0, agent.indexOf("FIXED ADAPTER BOUNDARY"));

describe("agent editable harness defaults", () => {
  it("caps turns and defaults to ollama provider", () => {
    expect(editable.includes("MAX_TURNS")).toBe(true);
    expect(/MAX_TURNS\s*=\s*\d+/.test(editable)).toBe(true);
    expect(editable.includes('AUTOAGENT_LLM_PROVIDER')).toBe(true);
    expect(editable.includes("ollama")).toBe(true);
  });
});
