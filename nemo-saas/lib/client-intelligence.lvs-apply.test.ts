import { describe, expect, it } from "vitest";
import { applyLvsInsightsToClientMd, ensureSeoGeoBaselineInClientMd } from "./client-intelligence";

describe("applyLvsInsightsToClientMd", () => {
  it("returns statuses for known GBP insight ids without throwing", () => {
    const seeded = ensureSeoGeoBaselineInClientMd("# Site\n", { primary_category: "plumber" });
    const { clientMd, statuses } = applyLvsInsightsToClientMd(seeded, [
      "gbp.profile_incomplete",
      "gbp.thin_photos",
      "gbp.low_review_velocity",
    ]);
    expect(clientMd.length).toBeGreaterThan(seeded.length - 1);
    expect(Object.keys(statuses).length).toBeGreaterThan(0);
  });
});
