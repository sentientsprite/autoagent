import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ut = join(__dirname, "../../app/(marketing)/ut/page.tsx");
const id = join(__dirname, "../../app/(marketing)/id/page.tsx");

describe("pSEO hubs reference article set", () => {
  it("UT + ID hub pages exist and mention guides/articles", () => {
    expect(existsSync(ut)).toBe(true);
    expect(existsSync(id)).toBe(true);
    const utSrc = readFileSync(ut, "utf8");
    const idSrc = readFileSync(id, "utf8");
    expect(utSrc.length).toBeGreaterThan(100);
    expect(idSrc.length).toBeGreaterThan(100);
    expect(/franchise/i.test(utSrc + idSrc)).toBe(false);
  });
});
