import { describe, expect, it } from "vitest";
import { FOUNDING, LOCATION_CAPS, locationCap } from "./money-farm";

describe("money-farm location caps", () => {
  it("free=1 founding/local_autopilot=5 growth=25 agency=100", () => {
    expect(locationCap("free")).toBe(1);
    expect(locationCap("local_autopilot")).toBe(FOUNDING.includedLocations);
    expect(locationCap("local_autopilot")).toBe(5);
    expect(locationCap("growth_operator")).toBe(25);
    expect(locationCap("agency")).toBe(100);
  });

  it("FOUNDING amount is $199/mo in cents", () => {
    expect(FOUNDING.amountCents).toBe(19_900);
    expect(FOUNDING.mapsToPlan).toBe("local_autopilot");
    expect(FOUNDING.trialDays).toBe(30);
  });

  it("LOCATION_CAPS covers every PlanTier key", () => {
    expect(Object.keys(LOCATION_CAPS).sort()).toEqual(
      ["agency", "free", "growth_operator", "local_autopilot"].sort(),
    );
  });
});
