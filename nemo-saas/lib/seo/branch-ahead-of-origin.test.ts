import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const repo = join(__dirname, "../../..");

describe("dayshift branch tip vs origin", () => {
  it("cursor/weekly-content-drafts is not behind origin (synced or local closeout ahead)", () => {
    const branch = execFileSync("git", ["branch", "--show-current"], {
      cwd: repo,
      encoding: "utf8",
    }).trim();
    expect(branch).toBe("cursor/weekly-content-drafts");
    const originTip = execFileSync(
      "git",
      ["rev-parse", "origin/cursor/weekly-content-drafts"],
      { cwd: repo, encoding: "utf8" },
    ).trim();
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
    // Post-Owner-push closeout: remove ahead≥100 floor. ahead=0 (synced) or ahead≥1 (local closeout) both OK.
    expect(ahead).toBeGreaterThanOrEqual(0);
    const mergeBase = execFileSync(
      "git",
      ["merge-base", "origin/cursor/weekly-content-drafts", "HEAD"],
      { cwd: repo, encoding: "utf8" },
    ).trim();
    expect(mergeBase).toBe(originTip);
  });
});
