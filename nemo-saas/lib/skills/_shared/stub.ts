/**
 * Stub helper for skills that are advertised in PLAN_JOBS / pricing.md /
 * onboarding-customer.md but not implemented yet.
 *
 * Why a stub instead of leaving the workflow `default` to throw:
 * - Honest UX. The workflow can return a structured "coming soon" result
 *   that the dashboard renders as "Scheduled — feature shipping <date>"
 *   instead of an opaque `unsupported_kind` failure.
 * - Type-safe wiring. The schema enum, PLAN_JOBS, and the workflow switch
 *   all stay in lockstep.
 * - SkillEval-ready. Once the real implementation lands, the stub is
 *   replaced and the Harbor task pack at tasks/<kind>/ asserts behavior.
 *
 * Each stub kind is gated on a milestone in NEMO-APP-v.1/MILESTONES.md.
 * Until that milestone hits, scheduling / on-demand of the kind throws a
 * NonRetriableError so Inngest does not retry.
 */
import { NonRetriableError } from "inngest";

export interface StubResult {
  deterministic: {
    not_implemented: true;
    kind: string;
    milestone: string;
    eta_note: string;
  };
}

export function stubRun(kind: string, milestone: string, etaNote: string): never {
  throw new NonRetriableError(
    `not_implemented_yet:${kind} (gated on ${milestone}: ${etaNote})`,
  );
}

export function stubResult(kind: string, milestone: string, etaNote: string): StubResult {
  return {
    deterministic: { not_implemented: true, kind, milestone, eta_note: etaNote },
  };
}
