import { describe, expect, it } from "vitest";
import { localPresenceInsights, type LocalPresenceProfile } from "./rule-engine";

const base: LocalPresenceProfile = {
  city: "Boulder",
  region: "CO",
  radiusMi: 15,
  distanceFromCityMi: 3,
  withinRadius: true,
  competitorCount: 8,
  listingRating: 4.6,
  listingReviews: 40,
  medianCompetitorRating: 4.5,
  medianCompetitorReviews: 35,
  primaryCategory: "plumber",
};

describe("localPresenceInsights", () => {
  it("emits local_presence_ok + local_competition when inside radius with peers", () => {
    const ids = localPresenceInsights(base).map((i) => i.id);
    expect(ids).toContain("gbp.local_presence_ok");
    expect(ids).toContain("gbp.local_competition");
  });

  it("emits outside_local_radius when withinRadius false", () => {
    const ids = localPresenceInsights({
      ...base,
      withinRadius: false,
      distanceFromCityMi: 40,
    }).map((i) => i.id);
    expect(ids).toContain("gbp.outside_local_radius");
    expect(ids).not.toContain("gbp.local_presence_ok");
  });

  it("emits behind_local_ratings when rating trails peers", () => {
    const ids = localPresenceInsights({
      ...base,
      listingRating: 4.0,
      medianCompetitorRating: 4.6,
      listingReviews: 20,
    }).map((i) => i.id);
    expect(ids).toContain("gbp.behind_local_ratings");
  });

  it("emits behind_local_review_volume when reviews << peer median", () => {
    const ids = localPresenceInsights({
      ...base,
      listingReviews: 5,
      medianCompetitorReviews: 40,
    }).map((i) => i.id);
    expect(ids).toContain("gbp.behind_local_review_volume");
  });
});
