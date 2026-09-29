import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const repo = join(__dirname, "../../..");

describe("dayshift dirty-tree flags", () => {
  it("CRM importer + uv.lock remain untracked (Owner gate)", () => {
    const out = execFileSync("git", ["status", "--short"], { cwd: repo, encoding: "utf8" });
    expect(out).toMatch(/\?\?\s+nemo-saas\/scripts\/import_rk_crm_xlsx\.py/);
    expect(out).toMatch(/\?\?\s+uv\.lock/);
  });
});
