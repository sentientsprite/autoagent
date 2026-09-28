import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const pkg = JSON.parse(readFileSync(join(__dirname, "../../package.json"), "utf8"));

describe("package smoke:prod script", () => {
  it("exposes smoke:prod via prod-smoke.mjs", () => {
    expect(pkg.scripts?.["smoke:prod"]).toMatch(/prod-smoke/);
    expect(pkg.scripts?.test).toMatch(/vitest/);
    expect(pkg.scripts?.typecheck).toMatch(/tsc/);
  });
});
