import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const resultPath = join(__dirname, "../../../jobs/gsc_01_dayshift/result.json");

describe("gsc_01_dayshift Harbor archive", () => {
  it("records mean 1.0 with zero errors", () => {
    expect(existsSync(resultPath)).toBe(true);
    const result = JSON.parse(readFileSync(resultPath, "utf8"));
    const evals = result.stats?.evals?.autoagent__adhoc;
    expect(evals?.metrics?.[0]?.mean).toBe(1.0);
    expect(evals?.n_errors ?? 0).toBe(0);
  });
});
