import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const pkg = JSON.parse(readFileSync(join(__dirname, "../../package.json"), "utf8"));

describe("nemo-saas package scripts", () => {
  it("exposes typecheck test and smoke:prod", () => {
    expect(pkg.scripts.typecheck).toBeTruthy();
    expect(pkg.scripts.test).toMatch(/vitest/);
    expect(pkg.scripts["smoke:prod"]).toMatch(/prod-smoke/);
  });
});
