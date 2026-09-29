import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const repo = join(__dirname, "../../..");

describe("dirty tree dayshift posture", () => {
  it("CRM importer + uv.lock stay untracked; no other non-test untracked junk", () => {
    const out = execFileSync("git", ["status", "--porcelain"], {
      cwd: repo,
      encoding: "utf8",
    });
    expect(out).toMatch(/\?\?\s+nemo-saas\/scripts\/import_rk_crm_xlsx\.py/);
    expect(out).toMatch(/\?\?\s+uv\.lock/);
    const untracked = out
      .split("\n")
      .filter((l) => l.startsWith("??"))
      .map((l) => l.slice(3).trim());
    const allowedExact = new Set([
      "nemo-saas/scripts/import_rk_crm_xlsx.py",
      "uv.lock",
    ]);
    for (const u of untracked) {
      if (allowedExact.has(u)) continue;
      // Allow in-flight invent tests under lib/seo before they are committed
      if (/^nemo-saas\/lib\/seo\/.+\.test\.ts$/.test(u)) continue;
      expect.fail(`unexpected untracked: ${u}`);
    }
  });
});
