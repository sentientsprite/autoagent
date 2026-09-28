import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const repo = join(__dirname, "../../..");

function score(fired: string[], expected: string[]): number {
  const script = `
import sys
sys.path.insert(0, ${JSON.stringify(join(repo, "tasks"))})
from _shared.verify import score_insights
print(score_insights(fired_ids=${JSON.stringify(fired)}, expected_ids=${JSON.stringify(expected)}))
`;
  const path = join(tmpdir(), `score-insights-${process.pid}-${Math.random().toString(16).slice(2)}.py`);
  writeFileSync(path, script);
  try {
    return Number(execFileSync("python3", [path], { encoding: "utf8" }).trim());
  } finally {
    unlinkSync(path);
  }
}

describe("verify.score_insights", () => {
  it("scores 1.0 on exact match", () => {
    expect(score(["ga.traffic_drop", "ga.high_bounce"], ["ga.traffic_drop", "ga.high_bounce"])).toBe(1.0);
  });
  it("penalizes missing expected ids", () => {
    expect(score([], ["ga.traffic_drop"])).toBeLessThan(1.0);
  });
  it("penalizes unexpected extras", () => {
    const s = score(["ga.traffic_drop", "extra"], ["ga.traffic_drop"]);
    expect(s).toBeLessThan(1.0);
    expect(s).toBeGreaterThan(0);
  });
});
