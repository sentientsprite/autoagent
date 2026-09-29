import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const agent = readFileSync(join(__dirname, "../../../agent.py"), "utf8");
const editable = agent.slice(0, agent.indexOf("FIXED ADAPTER BOUNDARY"));

describe("agent apply-script trio", () => {
  it("SYSTEM_PROMPT references LVS+GSC+GA4 apply engines above BOUNDARY", () => {
    for (const s of ["lvs_apply_rules.py", "gsc_apply_rules.py", "ga4_apply_rules.py"]) {
      expect(editable.includes(s), s).toBe(true);
    }
  });
});
