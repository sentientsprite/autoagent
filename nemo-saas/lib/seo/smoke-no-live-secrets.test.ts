import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const smoke = readFileSync(join(__dirname, "../../scripts/prod-smoke.mjs"), "utf8");

describe("prod-smoke.mjs avoids live secret material", () => {
  it("has no sk_live rk_live pk_live or whsec_ literals", () => {
    expect(smoke.includes("sk_live")).toBe(false);
    expect(smoke.includes("rk_live")).toBe(false);
    expect(smoke.includes("pk_live")).toBe(false);
    expect(smoke.includes("whsec_")).toBe(false);
  });
});
