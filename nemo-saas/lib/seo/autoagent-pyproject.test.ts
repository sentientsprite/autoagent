import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(__dirname, "../../..");

describe("autoagent pyproject", () => {
  it("exists and names the project", () => {
    const p = join(root, "pyproject.toml");
    expect(existsSync(p)).toBe(true);
    const src = readFileSync(p, "utf8");
    expect(src.toLowerCase()).toMatch(/autoagent|name\s*=/);
  });
});
