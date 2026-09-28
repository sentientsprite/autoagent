import { describe, expect, it } from "vitest";
import { buildWeeklyContentDrafts, mondayWeekStart } from "./content-drafts";

describe("content-drafts helpers", () => {
  it("mondayWeekStart snaps to Monday ISO date (UTC)", () => {
    // Monday 2026-09-28 UTC
    expect(mondayWeekStart(new Date(Date.UTC(2026, 8, 28, 18, 0, 0)))).toBe("2026-09-28");
    // Wednesday 2026-09-30 UTC → Monday 2026-09-28
    expect(mondayWeekStart(new Date(Date.UTC(2026, 8, 30, 12, 0, 0)))).toBe("2026-09-28");
    // Sunday 2026-10-04 UTC → Monday 2026-09-28
    expect(mondayWeekStart(new Date(Date.UTC(2026, 9, 4, 1, 0, 0)))).toBe("2026-09-28");
  });

  it("buildWeeklyContentDrafts returns 5 pseo stubs with LVS CTA", () => {
    const drafts = buildWeeklyContentDrafts("2026-09-28");
    expect(drafts).toHaveLength(5);
    expect(drafts.every((d) => d.channel === "pseo")).toBe(true);
    expect(drafts[0]?.body_md).toContain("Local Visibility Score");
    expect(drafts.some((d) => /Boise/i.test(d.title))).toBe(true);
  });
});
