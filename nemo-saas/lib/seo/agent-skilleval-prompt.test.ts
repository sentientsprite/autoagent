import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const agent = readFileSync(join(__dirname, "../../../agent.py"), "utf8");

describe("autoagent SYSTEM_PROMPT SkillEval wiring", () => {
  it("mentions LVS/GSC/GA4 deterministic apply scripts above FIXED ADAPTER BOUNDARY", () => {
    const boundary = agent.indexOf("FIXED ADAPTER BOUNDARY");
    expect(boundary).toBeGreaterThan(0);
    const editable = agent.slice(0, boundary);
    expect(editable.includes("lvs_apply_rules.py")).toBe(true);
    expect(editable.includes("gsc_apply_rules.py")).toBe(true);
    expect(editable.includes("ga4_apply_rules.py")).toBe(true);
    expect(editable.includes("SYSTEM_PROMPT")).toBe(true);
  });

  it("keeps FIXED ADAPTER BOUNDARY marker intact", () => {
    expect(agent.includes("# FIXED ADAPTER BOUNDARY: do not modify unless the human explicitly asks.")).toBe(true);
  });
});
