import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { readFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";

const repo = join(__dirname, "../../..");
const script = join(repo, "tasks/_shared/ga4_apply_rules.py");

function runCase(caseDir: string) {
  const input = join(repo, "tasks/ga4_health_brief", caseDir, "files/input.json");
  const expected = JSON.parse(
    readFileSync(join(repo, "tasks/ga4_health_brief", caseDir, "files/expected.json"), "utf8"),
  );
  const outPath = join(tmpdir(), `ga4-parity-${caseDir}-${process.pid}.json`);
  execFileSync("python3", [script, input, outPath], { encoding: "utf8" });
  const out = JSON.parse(readFileSync(outPath, "utf8"));
  unlinkSync(outPath);
  const ids = out.insights.map((i: { id: string }) => i.id);
  return { ids, expected };
}

describe("ga4_apply_rules.py Harbor fixture parity", () => {
  it("case_01 traffic_drop fires expected ids only", () => {
    const { ids, expected } = runCase("case_01_traffic_drop");
    for (const id of expected.rule_ids) expect(ids).toContain(id);
    for (const id of expected.must_not_fire) expect(ids).not.toContain(id);
  });

  it("case_02 ad_waste fires expected ids only", () => {
    const { ids, expected } = runCase("case_02_ad_waste");
    for (const id of expected.rule_ids) expect(ids).toContain(id);
    for (const id of expected.must_not_fire) expect(ids).not.toContain(id);
  });
});
