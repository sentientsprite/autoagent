import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const p = join(
  process.env.HOME || "",
  "Projects/build-assistant/workflows/nemo-skilleval-mon-owner-brief-2026-09-28.md",
);

describe("Monday owner brief", () => {
  it("includes GSC dayshift PASS and dirty-tree flags", () => {
    expect(existsSync(p)).toBe(true);
    const src = readFileSync(p, "utf8");
    expect(src.includes("GSC")).toBe(true);
    expect(src.includes("1.000")).toBe(true);
    expect(src.includes("import_rk_crm_xlsx") || src.includes("uv.lock")).toBe(true);
  });
});
