import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";

const tasks = join(__dirname, "../../../tasks");

const cases = [
  "gsc_opportunity_finder/case_01_basic_pos_4_to_15",
  "ga4_health_brief/case_01_traffic_drop",
  "local_visibility_audit/case_01_missing_phone_and_low_reviews",
];

describe("SkillEval case fixtures present", () => {
  it("GSC/GA4/LVS case_01 have instruction + task.toml + tests", () => {
    for (const rel of cases) {
      const base = join(tasks, rel);
      expect(existsSync(join(base, "instruction.md")), rel + "/instruction.md").toBe(true);
      expect(existsSync(join(base, "task.toml")), rel + "/task.toml").toBe(true);
      expect(existsSync(join(base, "tests")), rel + "/tests").toBe(true);
    }
  });
});
