import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = join(__dirname, "../../fixtures/keywords");

describe("keyword strategy fixtures", () => {
  it("ships template + export JSON with rows", () => {
    expect(existsSync(join(dir, "page-keyword-strategy.template.json"))).toBe(true);
    expect(existsSync(join(dir, "page-keyword-strategy.export.json"))).toBe(true);
    const exp = JSON.parse(readFileSync(join(dir, "page-keyword-strategy.export.json"), "utf8"));
    const rows = exp.rows ?? exp.sheets?.crmExport?.exampleRows ?? [];
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeGreaterThan(0);
  });
});
