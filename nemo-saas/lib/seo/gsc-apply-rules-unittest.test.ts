import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const repo = join(__dirname, "../../..");
const testFile = join(repo, "tasks/_shared/test_gsc_apply_rules.py");

describe("gsc_apply_rules.py unittest suite", () => {
  it("passes stdlib unittest", () => {
    const both = execFileSync("bash", ["-lc", `python3 ${JSON.stringify(testFile)} -v 2>&1`], {
      encoding: "utf8",
    });
    expect(both).toMatch(/Ran 3 tests/);
    expect(both).toMatch(/\nOK/);
  });
});
