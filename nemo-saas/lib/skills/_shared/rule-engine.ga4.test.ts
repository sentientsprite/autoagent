import { describe, expect, it } from "vitest";
import { ga4Insights } from "./rule-engine";

describe("ga4Insights", () => {
  it("flags traffic_spike on +20% sessions", () => {
    const out = ga4Insights({
      current: { sessions: 6000, users: 5000, bounceRate: 0.4, avgSessionDurationSec: 90, channels: { organic: 3000, paid: 500, direct: 2500 } },
      prior: { sessions: 4000, users: 3200, bounceRate: 0.4, avgSessionDurationSec: 90, channels: { organic: 2000, paid: 400, direct: 1600 } },
    });
    expect(out.map((i) => i.id)).toContain("ga.traffic_spike");
  });

  it("flags shallow_engagement when avg session < 30s", () => {
    const out = ga4Insights({
      current: { sessions: 1000, users: 900, bounceRate: 0.4, avgSessionDurationSec: 12, channels: { organic: 600, paid: 100, direct: 300 } },
      prior: { sessions: 1000, users: 900, bounceRate: 0.4, avgSessionDurationSec: 40, channels: { organic: 600, paid: 100, direct: 300 } },
    });
    expect(out.map((i) => i.id)).toContain("ga.shallow_engagement");
  });

  it("flags seo_opportunity when organic share < 20%", () => {
    const out = ga4Insights({
      current: { sessions: 1000, users: 900, bounceRate: 0.4, avgSessionDurationSec: 60, channels: { organic: 100, paid: 400, direct: 500 } },
      prior: { sessions: 1000, users: 900, bounceRate: 0.4, avgSessionDurationSec: 60, channels: { organic: 100, paid: 400, direct: 500 } },
    });
    expect(out.map((i) => i.id)).toContain("ga.seo_opportunity");
  });
});
