import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { join } from "node:path";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";

const repo = join(__dirname, "../../..");
const script = join(repo, "tasks/_shared/gsc_apply_rules.py");
const input = join(repo, "tasks/gsc_opportunity_finder/case_01_basic_pos_4_to_15/files/input.json");
const expected = JSON.parse(
  readFileSync(join(repo, "tasks/gsc_opportunity_finder/case_01_basic_pos_4_to_15/files/expected.json"), "utf8"),
);

describe("gsc_apply_rules.py parity with Harbor fixture", () => {
  it("emits expected pages in order and excludes must_not", () => {
    const outPath = join(tmpdir(), `gsc-parity-${process.pid}.json`);
    execFileSync("python3", [script, input, outPath], { encoding: "utf8" });
    const out = JSON.parse(readFileSync(outPath, "utf8"));
    unlinkSync(outPath);
    const pages = out.opportunities.map((o: { page: string }) => o.page);
    expect(pages.slice(0, expected.pages.length)).toEqual(expected.pages);
    for (const bad of expected.must_not_appear) {
      expect(pages).not.toContain(bad);
    }
  });
});
