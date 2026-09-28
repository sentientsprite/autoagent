import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const repo = join(__dirname, "../../..");

describe("dayshift branch ahead of origin", () => {
  it("cursor/weekly-content-drafts is ahead of origin (safe push candidate)", () => {
    const branch = execFileSync("git", ["branch", "--show-current"], {
      cwd: repo,
      encoding: "utf8",
    }).trim();
    expect(branch).toBe("cursor/weekly-content-drafts");
    const counts = execFileSync(
      "git",
      ["rev-list", "--left-right", "--count", "origin/cursor/weekly-content-drafts...HEAD"],
      { cwd: repo, encoding: "utf8" },
    ).trim();
    // format: behind\tahead
    const parts = counts.split(/\s+/);
    expect(parts.length).toBe(2);
    const behind = Number(parts[0]);
    const ahead = Number(parts[1]);
    expect(behind).toBe(0);
    expect(ahead).toBeGreaterThanOrEqual(100);
  });
});
