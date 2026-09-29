import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const scriptsDir = join(__dirname, "../../scripts");

describe("no unattended Vercel force deploy", () => {
  it("scripts/ do not call vercel --prod --yes / force deploy", () => {
    expect(existsSync(scriptsDir)).toBe(true);
    for (const name of readdirSync(scriptsDir)) {
      if (!/\.(mjs|js|ts|sh)$/.test(name)) continue;
      const src = readFileSync(join(scriptsDir, name), "utf8");
      expect(/vercel\s+--prod/.test(src) || /vercel\s+deploy.*--prod/.test(src), name).toBe(false);
      expect(/vercel\s+.*--force/.test(src), name).toBe(false);
    }
  });
});
