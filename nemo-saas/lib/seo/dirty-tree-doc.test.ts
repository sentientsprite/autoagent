import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const p = join(
  process.env.HOME || "",
  "Projects/build-assistant/workflows/nemo-dirty-tree-dayshift-2026-09-28.md",
);

describe("dirty-tree dayshift twin doc", () => {
  it("flags CRM importer + uv.lock DO NOT commit", () => {
    expect(existsSync(p)).toBe(true);
    const src = readFileSync(p, "utf8");
    expect(src.includes("import_rk_crm_xlsx")).toBe(true);
    expect(src.includes("uv.lock")).toBe(true);
    expect(src.includes("DO NOT commit")).toBe(true);
  });
});
