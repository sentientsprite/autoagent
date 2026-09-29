import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const repo = join(__dirname, "../../..");

describe("dayshift git branch", () => {
  it("is on cursor/weekly-content-drafts (no detached HEAD)", () => {
    const branch = execFileSync("git", ["branch", "--show-current"], {
      cwd: repo,
      encoding: "utf8",
    }).trim();
    expect(branch).toBe("cursor/weekly-content-drafts");
  });
});
