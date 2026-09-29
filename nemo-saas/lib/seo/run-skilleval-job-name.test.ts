import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const sh = readFileSync(join(__dirname, "../../../scripts/run-skilleval.sh"), "utf8");

describe("run-skilleval job naming", () => {
  it("accepts JOB_NAME arg and writes under jobs/", () => {
    expect(sh.includes("JOB_NAME")).toBe(true);
    expect(sh.includes("jobs/$JOB_NAME") || sh.includes('jobs/"$JOB_NAME"') || sh.includes("jobs/")).toBe(true);
    expect(sh.includes("--job-name") || sh.includes("job-name")).toBe(true);
  });
});
