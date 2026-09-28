import { describe, expect, it } from "vitest";
import { QUESTIONS, scoreBand, totalScore, type QuestionScore } from "./scorecard";

describe("owned-demand scorecard", () => {
  it("exposes seven questions", () => {
    expect(QUESTIONS).toHaveLength(7);
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(7);
  });

  it("bands rented/mixed/owned by total", () => {
    expect(scoreBand(0)).toBe("rented");
    expect(scoreBand(5)).toBe("rented");
    expect(scoreBand(6)).toBe("mixed");
    expect(scoreBand(10)).toBe("mixed");
    expect(scoreBand(11)).toBe("owned");
    expect(scoreBand(14)).toBe("owned");
  });

  it("totals answers across question ids", () => {
    const answers = Object.fromEntries(QUESTIONS.map((q) => [q.id, 2 as QuestionScore]));
    expect(totalScore(answers)).toBe(14);
  });
});
