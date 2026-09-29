import { describe, expect, it } from "vitest";
import { gbpInsights, type GbpProfile } from "./rule-engine";

const complete: GbpProfile = {
  hasName: true,
  hasAddress: true,
  hasPhone: true,
  hasWebsite: true,
  hasHours: true,
  hasPrimaryCategory: true,
  photoCount: 12,
  serviceAreaZipCount: 8,
  expectedServiceAreaZipCount: 8,
  reviewCount: 40,
  avgRating: 4.7,
  reviewsLast90d: 5,
};

describe("gbpInsights", () => {
  it("flags profile_incomplete + thin_photos + low_review_velocity on Harbor-ish gaps", () => {
    const out = gbpInsights({
      ...complete,
      hasPhone: false,
      hasHours: false,
      photoCount: 4,
      reviewsLast90d: 1,
    });
    const ids = out.map((i) => i.id);
    expect(ids).toContain("gbp.profile_incomplete");
    expect(ids).toContain("gbp.thin_photos");
    expect(ids).toContain("gbp.low_review_velocity");
  });

  it("flags service_area_gaps when zip counts diverge", () => {
    const out = gbpInsights({ ...complete, serviceAreaZipCount: 3, expectedServiceAreaZipCount: 8 });
    expect(out.map((i) => i.id)).toContain("gbp.service_area_gaps");
  });

  it("flags rating_under_4_2 when enough reviews and rating low", () => {
    const out = gbpInsights({ ...complete, avgRating: 3.9, reviewCount: 25 });
    expect(out.map((i) => i.id)).toContain("gbp.rating_under_4_2");
  });

  it("emits service_area_listing info for pure SAB", () => {
    const out = gbpInsights({ ...complete, pureServiceAreaBusiness: true, hasAddress: false });
    expect(out.map((i) => i.id)).toContain("gbp.service_area_listing");
    expect(out.map((i) => i.id)).not.toContain("gbp.profile_incomplete");
  });
});
