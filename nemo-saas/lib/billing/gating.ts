/**
 * Server-side plan gating helpers used by API routes and Inngest workflows.
 * Always call planAllows() before enqueuing a job kind for a tenant.
 */
import { dbAsService } from "@/lib/db/client";
import { planAllows } from "@/lib/billing/stripe";
import type { JobKind, PlanTier } from "@/lib/db/types";

export interface PlanGuardResult {
  allowed: boolean;
  plan: PlanTier;
  reason?: string;
}

export async function guardJobForOrg(orgId: string, kind: JobKind): Promise<PlanGuardResult> {
  const db = dbAsService();
  const { data, error } = await db.from("orgs").select("plan").eq("id", orgId).single();
  if (error || !data) return { allowed: false, plan: "free", reason: "org_not_found" };
  const plan = data.plan as PlanTier;
  if (!planAllows(plan, kind)) {
    return { allowed: false, plan, reason: `plan_${plan}_does_not_include_${kind}` };
  }
  return { allowed: true, plan };
}
