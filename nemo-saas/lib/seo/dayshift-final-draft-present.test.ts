import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const p = join(
  process.env.HOME || "",
  "Projects/build-assistant/workflows/grokbot-dayshift-final-2026-09-28.md",
);

describe("dayshift final doc draft", () => {
  it("exists with GSC 1.000 and dirty CRM flags", () => {
    expect(existsSync(p)).toBe(true);
    const src = readFileSync(p, "utf8");
    expect(src.includes("1.000")).toBe(true);
    expect(src.includes("uv.lock") || src.includes("import_rk_crm")).toBe(true);
    expect(src.includes("6fb36cd")).toBe(true);
  });
});
