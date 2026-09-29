import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const repo = join(__dirname, "../../..");

describe("dayshift commit floor 100", () => {
  it("has at least 100 commits since overnight tip 6fb36cd", () => {
    const out = execFileSync("git", ["rev-list", "--count", "6fb36cd..HEAD"], {
      cwd: repo,
      encoding: "utf8",
    }).trim();
    expect(Number(out)).toBeGreaterThanOrEqual(100);
  });
});
