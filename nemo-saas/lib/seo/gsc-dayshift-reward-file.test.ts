import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const job = join(__dirname, "../../../jobs/gsc_01_dayshift");

describe("gsc_01_dayshift reward archive", () => {
  it("has a trial verifier reward of 1.0000", () => {
    expect(existsSync(job)).toBe(true);
    const trials = readdirSync(job).filter((d) => d.startsWith("case_01"));
    expect(trials.length).toBeGreaterThan(0);
    const reward = readFileSync(join(job, trials[0]!, "verifier", "reward.txt"), "utf8").trim();
    expect(reward).toBe("1.0000");
  });
});
