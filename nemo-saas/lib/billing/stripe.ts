import Stripe from "stripe";

import type { JobKind, PlanTier } from "@/lib/db/types";

let cached: Stripe | null = null;

export function stripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY missing");
  // Pin to the SDK's current default API version. Bump intentionally when
  // upgrading the stripe package; do not chase versions silently.
  cached = new Stripe(key);
  return cached;
}

/**
 * Plan -> allowed scheduled job kinds. The control plane gates which schedules
 * a tenant can create. On-demand jobs (LVS audit) are always allowed for free.
 */
export const PLAN_JOBS: Record<PlanTier, ReadonlyArray<JobKind>> = {
  free: ["local_visibility_audit"],
  local_autopilot: [
    "local_visibility_audit",
    "ga4_health_brief",
    "reputation_loop",
    "local_landing_builder",
  ],
  growth_operator: [
    "local_visibility_audit",
    "gsc_opportunity_finder",
    "ga4_health_brief",
    "local_landing_builder",
    "paid_qa",
    "reputation_loop",
  ],
  agency: [
    "local_visibility_audit",
    "gsc_opportunity_finder",
    "ga4_health_brief",
    "local_landing_builder",
    "paid_qa",
    "reputation_loop",
    "competitor_pulse",
  ],
};

export function planAllows(plan: PlanTier, kind: JobKind): boolean {
  return PLAN_JOBS[plan].includes(kind);
}
