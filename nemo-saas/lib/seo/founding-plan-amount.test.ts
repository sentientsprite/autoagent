import { describe, expect, it } from "vitest";
import { FOUNDING_PLAN } from "@/lib/billing/stripe";
import { FOUNDING } from "@/lib/billing/money-farm";

describe("Founding plan amount lock", () => {
  it("stays $199/mo and ≤5 locations", () => {
    expect(FOUNDING_PLAN.amountCents).toBe(19_900);
    expect(FOUNDING_PLAN.locationCap).toBe(5);
    expect(FOUNDING.amountCents).toBe(19_900);
    expect(FOUNDING.includedLocations).toBe(5);
  });
});
