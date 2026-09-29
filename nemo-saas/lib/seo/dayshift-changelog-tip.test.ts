import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const changelog = readFileSync(
  join(process.env.HOME || "", "Projects/build-assistant/workflows/nemo-dayshift-hardening-changelog-2026-09-28.md"),
  "utf8",
);
const tip = execFileSync("git", ["rev-parse", "--short", "HEAD"], {
  cwd: join(__dirname, "../../.."),
  encoding: "utf8",
}).trim();

describe("dayshift hardening changelog", () => {
  it("mentions overnight tip and current HEAD tip", () => {
    expect(changelog.includes("6fb36cd")).toBe(true);
    expect(changelog.includes(tip)).toBe(true);
  });
});
