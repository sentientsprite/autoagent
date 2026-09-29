import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const wf = join(process.env.HOME || "", "Projects/build-assistant/workflows");

const required = [
  "grokbot-dayshift-progress-2026-09-28.md",
  "nemo-dayshift-hardening-changelog-2026-09-28.md",
  "nemo-skilleval-mon-owner-brief-2026-09-28.md",
  "nemo-skilleval-gsc01-dayshift-2026-09-28.md",
  "nemo-dayshift-inventions-index-2026-09-28.md",
];

describe("dayshift workflow docs present", () => {
  it("ships progress, changelog, owner brief, GSC doc, inventions index", () => {
    for (const name of required) {
      const p = join(wf, name);
      expect(existsSync(p), name).toBe(true);
      const src = readFileSync(p, "utf8");
      expect(src.length, name).toBeGreaterThan(40);
    }
  });
});
