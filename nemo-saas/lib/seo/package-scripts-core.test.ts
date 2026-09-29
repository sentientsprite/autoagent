import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const pkg = JSON.parse(readFileSync(join(__dirname, "../../package.json"), "utf8"));

describe("package.json core scripts", () => {
  it("defines test typecheck lint smoke:prod build", () => {
    for (const s of ["test", "typecheck", "lint", "smoke:prod", "build", "dev"]) {
      expect(typeof pkg.scripts?.[s], s).toBe("string");
      expect(pkg.scripts[s].length).toBeGreaterThan(0);
    }
  });
});
