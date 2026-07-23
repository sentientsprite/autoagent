/**
 * Owned Demand Scorecard — score lead sources 0–2 on seven questions.
 * Pure helpers for the self-serve Nemo Local module (client-side v1).
 */

export type QuestionScore = 0 | 1 | 2;

export type DemandBand = "rented" | "mixed" | "owned";

export interface ScoreQuestion {
  id: string;
  prompt: string;
  /** Hint for the 0 / 1 / 2 scale */
  scaleHint: string;
}

export const QUESTIONS: ScoreQuestion[] = [
  {
    id: "knows_name",
    prompt: "Does the buyer know your business name before the call?",
    scaleHint: "0 = never · 1 = sometimes · 2 = usually",
  },
  {
    id: "exclusive",
    prompt: "Is the lead sold to anyone else?",
    scaleHint: "0 = shared widely · 1 = limited · 2 = exclusive / yours",
  },
  {
    id: "price_process_proof",
    prompt: "Can the buyer see price, process, and proof first?",
    scaleHint: "0 = opaque · 1 = partial · 2 = clear before the form",
  },
  {
    id: "attribution",
    prompt: "Can you follow the page or query back to the booked job?",
    scaleHint: "0 = no tracking · 1 = partial · 2 = page → job",
  },
  {
    id: "cheaper_with_proof",
    prompt: "Does the channel get cheaper as your proof library grows?",
    scaleHint: "0 = always more spend · 1 = flat · 2 = compounds with proof",
  },
  {
    id: "own_assets",
    prompt: "Do you own the reviews, page, and buyer data?",
    scaleHint: "0 = platform owns it · 1 = mixed · 2 = you own it",
  },
  {
    id: "multi_use_asset",
    prompt: "Can the same asset help search, AI answers, ads, and sales?",
    scaleHint: "0 = one-channel only · 1 = two channels · 2 = reusable everywhere",
  },
];

export const BAND_COPY: Record<
  DemandBand,
  { label: string; range: string; color: string; bg: string; blurb: string }
> = {
  rented: {
    label: "Rented demand",
    range: "0–5",
    color: "#b91c1c",
    bg: "#fef2f2",
    blurb: "You are paying for introductions you do not control.",
  },
  mixed: {
    label: "Mixed control",
    range: "6–10",
    color: "#b45309",
    bg: "#fffbeb",
    blurb: "Some ownership — still leaking margin to platforms.",
  },
  owned: {
    label: "Owned demand",
    range: "11–14",
    color: "#0f766e",
    bg: "#f0fdfa",
    blurb: "Proof and assets compound; you control the path to the booked job.",
  },
};

export function totalScore(answers: Record<string, QuestionScore>): number {
  return QUESTIONS.reduce((sum, q) => sum + (answers[q.id] ?? 0), 0);
}

export function scoreBand(total: number): DemandBand {
  if (total <= 5) return "rented";
  if (total <= 10) return "mixed";
  return "owned";
}

/** Cost per booked job before labor, refunds, or no-shows. Null if booked is 0. */
export function costPerBookedJob(
  leadsBought: number,
  spend: number,
  jobsBooked: number,
): number | null {
  if (!Number.isFinite(spend) || !Number.isFinite(jobsBooked) || jobsBooked <= 0) {
    return null;
  }
  void leadsBought; // available for conversion math later
  return spend / jobsBooked;
}

export const REPLACEMENT_STEPS: { id: string; label: string }[] = [
  { id: "faq", label: "Publish the emergency-call questions buyers ask" },
  { id: "response", label: "Show response time and service-area fit" },
  { id: "price", label: "Explain the price range before the form" },
  { id: "reviews", label: "Attach review proof to the exact service" },
  { id: "compare", label: "Build comparison pages for the alternatives buyers already consider" },
  { id: "measure", label: "Measure which page created each booked job" },
];

export interface LeadSourceSeed {
  id: string;
  name: string;
}

export const DEFAULT_SOURCES: LeadSourceSeed[] = [
  { id: "angi", name: "Angi / HomeAdvisor" },
  { id: "lsa", name: "Google Local Services Ads" },
  { id: "facebook", name: "Facebook leads" },
  { id: "website", name: "Website / GBP organic" },
  { id: "referrals", name: "Referrals" },
];

/** Nashville plumber marketplace example from the scorecard playbook. */
export const NASHVILLE_EXAMPLE = {
  label: "Nashville plumber · marketplace leads",
  leadsBought: 58,
  spend: 5220,
  jobsBooked: 5,
  /** 5220 / 5 */
  costPerBooked: 1044,
};

/** Low scores typical of shared marketplace leads (demo / Angi). */
export const RENTED_MARKETPLACE_ANSWERS: Record<string, QuestionScore> = {
  knows_name: 0,
  exclusive: 0,
  price_process_proof: 0,
  attribution: 1,
  cheaper_with_proof: 0,
  own_assets: 0,
  multi_use_asset: 0,
};

export function emptyAnswers(): Record<string, QuestionScore> {
  return Object.fromEntries(QUESTIONS.map((q) => [q.id, 0 as QuestionScore]));
}
