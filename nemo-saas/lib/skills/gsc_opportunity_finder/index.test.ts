import { describe, expect, it } from "vitest";
import { runDeterministic } from "./index";
import type { GscQueryRow } from "@/lib/connectors/google";

const rows: GscQueryRow[] = [
  { query: "water heater repair boulder", page: "https://example.com/services/water-heater-repair", clicks: 22, impressions: 1840, ctr: 0.012, position: 7.4 },
  { query: "tankless water heater install", page: "https://example.com/services/water-heater-repair", clicks: 18, impressions: 1320, ctr: 0.014, position: 8.1 },
  { query: "broken water heater fix", page: "https://example.com/services/water-heater-repair", clicks: 9, impressions: 740, ctr: 0.012, position: 9.2 },
  { query: "drain cleaning boulder", page: "https://example.com/services/drain-cleaning", clicks: 6, impressions: 410, ctr: 0.015, position: 11.0 },
  { query: "kitchen sink clog", page: "https://example.com/services/drain-cleaning", clicks: 4, impressions: 280, ctr: 0.014, position: 12.2 },
  { query: "best plumber boulder", page: "https://example.com/", clicks: 5, impressions: 520, ctr: 0.01, position: 6.5 },
  // must not appear: emergency page / low impressions / out of band
  { query: "emergency plumber", page: "https://example.com/services/emergency", clicks: 50, impressions: 2000, ctr: 0.025, position: 2.1 },
  { query: "tiny query", page: "https://example.com/services/drain-cleaning", clicks: 1, impressions: 40, ctr: 0.025, position: 8.0 },
];

describe("gsc_opportunity_finder runDeterministic", () => {
  it("ranks water-heater-repair first and excludes emergency + low-impr", async () => {
    const out = await runDeterministic({ rows, startDate: "90daysAgo", endDate: "today" });
    const pages = out.opportunities.map((o) => o.page);
    expect(pages[0]).toBe("https://example.com/services/water-heater-repair");
    expect(pages).toContain("https://example.com/services/drain-cleaning");
    expect(pages).toContain("https://example.com/");
    expect(pages).not.toContain("https://example.com/services/emergency");
    expect(out.opportunities[0].estimatedMonthlyClickLift).toBeGreaterThan(0);
    expect(out.totalRows).toBe(rows.length);
  });
});
