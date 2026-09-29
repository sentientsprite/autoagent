import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const script = join(__dirname, "../../../tasks/_shared/ga4_apply_rules.py");

describe("ga4_apply_rules.py present", () => {
  it("exists and writes insights array", () => {
    expect(existsSync(script)).toBe(true);
    const src = readFileSync(script, "utf8");
    expect(src.includes("insights")).toBe(true);
    expect(src.includes("/task/output.json")).toBe(true);
  });
});
