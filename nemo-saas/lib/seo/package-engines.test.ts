import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const pkg = JSON.parse(readFileSync(join(__dirname, "../../package.json"), "utf8"));

describe("package.json engines", () => {
  it("requires Node >=20", () => {
    expect(pkg.engines?.node).toMatch(/>=\s*20/);
  });
});
