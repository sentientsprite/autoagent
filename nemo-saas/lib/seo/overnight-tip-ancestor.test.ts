import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const repo = join(__dirname, "../../..");

describe("overnight tip still ancestor", () => {
  it("6fb36cd is ancestor of HEAD and tip is not overnight", () => {
    execFileSync("git", ["merge-base", "--is-ancestor", "6fb36cd", "HEAD"], { cwd: repo });
    const tip = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: repo,
      encoding: "utf8",
    }).trim();
    expect(tip).not.toBe("6fb36cd");
    const n = Number(
      execFileSync("git", ["rev-list", "--count", "6fb36cd..HEAD"], {
        cwd: repo,
        encoding: "utf8",
      }).trim(),
    );
    expect(n).toBeGreaterThanOrEqual(110);
  });
});
