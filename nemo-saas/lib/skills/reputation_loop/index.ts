/**
 * Skill: reputation_loop — STUB
 *
 * Echo add-on: post-job review request flywheel. Triggers SMS/email after
 * CRM "job complete" events (Jobber, Housecall Pro, ServiceTitan).
 *
 * Gated on M-JUN-15 (Echo launch) per BUSINESS_PLAN §7. Ships before
 * paid_qa because it has zero OAuth dependency.
 */
import { stubRun, type StubResult } from "@/lib/skills/_shared/stub";

const KIND = "reputation_loop";
const MILESTONE = "M-JUN-15";
const ETA = "Echo (post-job review flywheel) launch — see BUSINESS_PLAN §7";

export interface SkillResult extends StubResult {}

export async function run(_input: unknown, _opts: unknown = {}): Promise<SkillResult> {
  stubRun(KIND, MILESTONE, ETA);
}
