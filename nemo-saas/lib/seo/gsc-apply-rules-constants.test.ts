import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "../../../tasks/_shared/gsc_apply_rules.py"), "utf8");

describe("gsc_apply_rules constants", () => {
  it("uses impressions>=100, position 4..15, target CTR 0.11, top 5/25", () => {
    expect(src.includes("MIN_IMPRESSIONS = 100")).toBe(true);
    expect(src.includes("MIN_POSITION = 4")).toBe(true);
    expect(src.includes("MAX_POSITION = 15")).toBe(true);
    expect(src.includes("TARGET_CTR = 0.11")).toBe(true);
    expect(src.includes("TOP_QUERIES_PER_PAGE = 5")).toBe(true);
    expect(src.includes("TOP_OPPORTUNITIES = 25")).toBe(true);
  });
});
