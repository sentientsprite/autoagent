import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const repo = join(__dirname, "../../..");

describe("dayshift tip ahead of overnight", () => {
  it("HEAD is a descendant of overnight tip 6fb36cd", () => {
    const ancestry = execFileSync(
      "git",
      ["merge-base", "--is-ancestor", "6fb36cd", "HEAD"],
      { cwd: repo, encoding: "utf8" },
    );
    // exit 0 means ancestor — execFileSync throws on non-zero
    expect(ancestry).toBe("");
    const tip = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
      cwd: repo,
      encoding: "utf8",
    }).trim();
    expect(tip).not.toBe("6fb36cd");
  });
});
