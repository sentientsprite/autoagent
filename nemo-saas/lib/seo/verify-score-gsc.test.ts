import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const repo = join(__dirname, "../../..");
const verify = join(repo, "tasks/_shared/verify.py");

function score(output: object, expected: object): number {
  const script = `
import json, sys
sys.path.insert(0, ${JSON.stringify(join(repo, "tasks"))})
from _shared.verify import score_gsc_opportunities
output = json.loads(${JSON.stringify(JSON.stringify(output))})
expected = json.loads(${JSON.stringify(JSON.stringify(expected))})
print(score_gsc_opportunities(output=output, expected=expected))
`;
  const path = join(tmpdir(), `score-gsc-${process.pid}.py`);
  writeFileSync(path, script);
  try {
    const out = execFileSync("python3", [path], { encoding: "utf8" }).trim();
    return Number(out);
  } finally {
    unlinkSync(path);
  }
}

describe("verify.score_gsc_opportunities", () => {
  it("scores 1.0 when pages match expected order", () => {
    const expected = { pages: ["https://a.example/", "https://b.example/"] };
    const output = {
      opportunities: [{ page: "https://a.example/" }, { page: "https://b.example/" }],
    };
    expect(score(output, expected)).toBe(1.0);
  });

  it("scores lower when top page wrong but coverage full", () => {
    const expected = { pages: ["https://a.example/", "https://b.example/"] };
    const output = {
      opportunities: [{ page: "https://b.example/" }, { page: "https://a.example/" }],
    };
    const s = score(output, expected);
    expect(s).toBeGreaterThan(0.8);
    expect(s).toBeLessThan(1.0);
  });

  it("scores 0 when empty opportunities", () => {
    expect(score({ opportunities: [] }, { pages: ["https://a.example/"] })).toBe(0);
  });
});
