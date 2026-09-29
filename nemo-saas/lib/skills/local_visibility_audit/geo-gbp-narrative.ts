/**
 * GEO + GBP activity narrative task prompt (TASK-0013 Draft A).
 *
 * Appended to / composed with the LVS narrative `task` string when the
 * deterministic insights include Maps / GBP / schema / review-velocity signals.
 * Hermes TASK-0028: treat GEO as clearer answers + citation readiness,
 * not a second website; keep Maps/GBP do-first before AI-citation upsell.
 */
export const GEO_GBP_ACTIVITY_NARRATIVE_TASK = `
Write the headline + 1-paragraph summary + top 3 prioritized fixes for this
Local Visibility audit. Each fix MUST cite an insight id from the structured
input. Do not invent insights. Frame fixes in dollars-and-jobs terms.

GEO / AI-citation layer (use only if matching insight ids exist):
- Maps ≠ GEO: Map Pack completeness (category, NAP, services, photos, review
  velocity) is the Saturday-call layer; AI citation readiness is secondary.
- If schema.localbusiness_missing fires: explain LocalBusiness JSON-LD must
  match GBP NAP character-for-character — not a GEO retainer, a site fix.
- If gbp.low_review_velocity or photo/profile gaps fire: treat those as
  activity/heartbeat signals (GBP recency proxy). Do not claim GBP post
  dates unless an insight provides them (Places cannot see posts today).
- Prefer FAQ / answer-block language when recommending on-page fixes:
  real homeowner question phrasing beats brand voice.
- Never upsell “GEO-only” or invent AI Overview / ChatGPT citation rates.
- CTA stays Local Visibility Score / do-first checklist — owner stays in control.
`.trim();

/** Short system addendum for playbook overrides (wedge / paid narrative). */
export const GEO_GBP_PLAYBOOK_ADDENDUM = `
## GEO / GBP activity (TASK-0013)
- Lead with Maps/GBP completeness. GEO = clearer answers, entity, schema, FAQ.
- Review velocity + photos = activity proxy until GBP posts API exists.
- schema.localbusiness_* insights are GEO-adjacent NAP/entity checks.
- No invented AI-citation metrics. No unsupervised GBP edits.
`.trim();
