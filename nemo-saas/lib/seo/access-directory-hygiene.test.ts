import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "../access-directory.ts"), "utf8");

describe("access-directory hygiene", () => {
  it("has no live Stripe secret material", () => {
    expect(src.includes("sk_live")).toBe(false);
    expect(src.includes("rk_live")).toBe(false);
    expect(src.includes("pk_live")).toBe(false);
    expect(src.includes("whsec_")).toBe(false);
  });
});
