import { describe, expect, it } from "vitest";
import { runDeterministic } from "./index";

const trafficDropFixture = {
  current: {
    sessions: 4200,
    users: 3100,
    bounceRate: 0.68,
    avgSessionDurationSec: 65,
    channels: { organic: 1100, paid: 900, direct: 1300, social: 600, referral: 300 },
  },
  prior: {
    sessions: 5400,
    users: 4000,
    bounceRate: 0.55,
    avgSessionDurationSec: 80,
    channels: { organic: 1500, paid: 800, direct: 1700, social: 900, referral: 500 },
  },
};

describe("ga4_health_brief runDeterministic", () => {
  it("flags traffic_drop + high_bounce on Harbor case_01 fixture shape", async () => {
    const out = await runDeterministic({ fixture: trafficDropFixture, windowDays: 28 });
    const ids = out.insights.map((i) => i.id);
    expect(ids).toContain("ga.traffic_drop");
    expect(ids).toContain("ga.high_bounce");
    expect(out.windowDays).toBe(28);
    expect(out.current.sessions).toBe(4200);
  });
});
