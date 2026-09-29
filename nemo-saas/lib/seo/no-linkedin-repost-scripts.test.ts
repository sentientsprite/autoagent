import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const scriptsDir = join(__dirname, "../../scripts");

describe("no LinkedIn re-post scripts", () => {
  it("scripts/ has no linkedin/repost publishers", () => {
    expect(existsSync(scriptsDir)).toBe(true);
    const names = readdirSync(scriptsDir);
    expect(names.filter((n) => /linkedin|repost/i.test(n))).toEqual([]);
    for (const name of names) {
      if (!/\.(mjs|js|ts|sh)$/.test(name)) continue;
      if (name === "import_rk_crm_xlsx.py") continue;
      const src = readFileSync(join(scriptsDir, name), "utf8");
      expect(/linkedin\.com\/sharing|api\.linkedin|repost.*linkedin/i.test(src), name).toBe(false);
    }
  });
});
