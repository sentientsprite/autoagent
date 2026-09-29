import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const p = join(
  process.env.HOME || "",
  "Projects/build-assistant/workflows/nemo-pr-readiness-dayshift-2026-09-28.md",
);

describe("PR readiness dayshift note", () => {
  it("exists and forbids merge/force-push from bot", () => {
    expect(existsSync(p)).toBe(true);
    const src = readFileSync(p, "utf8");
    expect(src.includes("no merge") || src.includes("no force-push") || src.includes("force-push")).toBe(true);
    expect(src.includes("cursor/weekly-content-drafts")).toBe(true);
  });
});
