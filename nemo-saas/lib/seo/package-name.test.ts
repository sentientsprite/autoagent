import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const pkg = JSON.parse(readFileSync(join(__dirname, "../../package.json"), "utf8"));

describe("package identity", () => {
  it("is the nemo-saas / nemo local app package", () => {
    expect(String(pkg.name).toLowerCase()).toMatch(/nemo/);
    expect(pkg.private === true || typeof pkg.version === "string").toBe(true);
  });
});
