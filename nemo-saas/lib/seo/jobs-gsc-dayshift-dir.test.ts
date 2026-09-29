import { describe, expect, it } from "vitest";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

const job = join(__dirname, "../../../jobs/gsc_01_dayshift");

describe("jobs/gsc_01_dayshift archive dir", () => {
  it("exists with result.json and at least one trial folder", () => {
    expect(existsSync(job)).toBe(true);
    expect(existsSync(join(job, "result.json"))).toBe(true);
    const kids = readdirSync(job);
    expect(kids.some((k) => k.startsWith("case_"))).toBe(true);
  });
});
