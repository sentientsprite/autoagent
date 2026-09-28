import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "../../.env.example"), "utf8");

describe(".env.example ALLOW_STRIPE_LIVE docs", () => {
  it("documents LIVE refuse override without assigning a live secret", () => {
    expect(src.includes("ALLOW_STRIPE_LIVE")).toBe(true);
    expect(src.includes("sk_live_") || src.includes("sk_live")).toBe(true);
    for (const line of src.split("\n")) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      expect(/^ALLOW_STRIPE_LIVE\s*=\s*1\b/.test(t)).toBe(false);
      expect(/^ALLOW_STRIPE_LIVE\s*=\s*sk_/.test(t)).toBe(false);
    }
  });
});
