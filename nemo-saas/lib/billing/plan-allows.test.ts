import { describe, expect, it } from "vitest";
import { planAllows, PLAN_JOBS } from "./stripe";
import type { PlanTier } from "@/lib/db/types";

const PLANS = Object.keys(PLAN_JOBS) as PlanTier[];

describe("planAllows matrix (no Stripe network)", () => {
  it("free allows LVS only", () => {
    expect(planAllows("free", "local_visibility_audit")).toBe(true);
    expect(planAllows("free", "gsc_opportunity_finder")).toBe(false);
    expect(planAllows("free", "competitor_pulse")).toBe(false);
  });

  it("agency includes competitor_pulse; free/local_autopilot do not", () => {
    expect(planAllows("agency", "competitor_pulse")).toBe(true);
    expect(planAllows("local_autopilot", "competitor_pulse")).toBe(false);
    expect(planAllows("growth_operator", "competitor_pulse")).toBe(false);
  });

  it("every PLAN_JOBS entry is a non-empty array for known tiers", () => {
    expect(PLANS.sort()).toEqual(
      ["agency", "free", "growth_operator", "local_autopilot"].sort(),
    );
    for (const plan of PLANS) {
      expect(PLAN_JOBS[plan].length).toBeGreaterThan(0);
      for (const kind of PLAN_JOBS[plan]) {
        expect(planAllows(plan, kind)).toBe(true);
      }
    }
  });
});
