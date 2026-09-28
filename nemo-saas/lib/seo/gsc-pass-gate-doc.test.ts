import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const doc = readFileSync(
  join(process.env.HOME || "", "Projects/build-assistant/workflows/nemo-skilleval-gsc01-dayshift-2026-09-28.md"),
  "utf8",
);

describe("GSC dayshift PASS_GATE doc", () => {
  it("status PASS_GATE with mean 1.000 and no thrash lane", () => {
    expect(doc.includes("PASS_GATE") || doc.includes("status: PASS_GATE")).toBe(true);
    expect(doc.includes("1.000")).toBe(true);
    expect(doc.includes("gsc_apply_rules")).toBe(true);
    expect(doc.includes("no thrash") || doc.includes("ONE Harbor") || doc.includes("ONE fix")).toBe(true);
  });
});
