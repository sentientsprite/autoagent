import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const marketing = join(__dirname, "../../app/(marketing)");

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(tsx?|jsx?|md|txt)$/.test(name)) out.push(p);
  }
  return out;
}

describe("marketing sources avoid live secret material", () => {
  it("has no sk_live rk_live pk_live or whsec_ literals", () => {
    for (const file of walk(marketing)) {
      const src = readFileSync(file, "utf8");
      expect(src.includes("sk_live"), file).toBe(false);
      expect(src.includes("rk_live"), file).toBe(false);
      expect(src.includes("pk_live"), file).toBe(false);
      expect(src.includes("whsec_"), file).toBe(false);
    }
  });
});
