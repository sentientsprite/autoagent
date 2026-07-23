/**
 * Turn structured LVS insights into plain-English action items with
 * expandable checklist steps — the customer-facing audit shape.
 */
import type { Insight } from "@/lib/skills/_shared/rule-engine";

export type ActionItemPriority = "do_first" | "this_week" | "keep_going";

export interface ActionChecklistStep {
  id: string;
  label: string;
  detail?: string;
}

export interface ActionItem {
  id: string;
  priority: ActionItemPriority;
  severity: Insight["severity"];
  title: string;
  why: string;
  outcome: string;
  steps: ActionChecklistStep[];
}

const PRIORITY_FROM_SEVERITY: Record<Insight["severity"], ActionItemPriority> = {
  critical: "do_first",
  warning: "this_week",
  info: "this_week",
  win: "keep_going",
};

const CHECKLISTS: Record<string, (insight: Insight) => ActionChecklistStep[]> = {
  "gbp.not_found": () => [
    { id: "1", label: "Go to business.google.com and sign in with your business Google account" },
    { id: "2", label: "Click “Manage now” / “Add your business” and enter the exact legal name customers search for" },
    { id: "3", label: "Confirm the primary category (e.g. Plumber, Landscaper) and service area ZIP" },
    { id: "4", label: "Verify ownership via postcard, phone, or email — don’t skip this step" },
    { id: "5", label: "Add phone, website, hours, and 5+ photos before you publish" },
  ],
  "gbp.profile_incomplete": (insight) => {
    const missing = String(insight.evidence?.missing ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const fieldSteps = (missing.length ? missing : ["phone", "website", "hours", "category"]).map(
      (field, i) => ({
        id: `m${i}`,
        label: `Add your ${field} in Google Business Profile → Info`,
        detail: field === "hours" ? "Use the hours customers actually call you." : undefined,
      }),
    );
    return [
      { id: "0", label: "Open business.google.com → your listing → Edit profile / Info" },
      ...fieldSteps,
      { id: "z", label: "Hit Save, then search your business name + ZIP on Google to confirm it shows" },
    ];
  },
  "gbp.thin_photos": (insight) => {
    const count = Number(insight.evidence?.photoCount ?? 0);
    const need = Math.max(10 - count, 3);
    return [
      { id: "1", label: `Gather ${need}+ recent job photos (before/after works best)` },
      { id: "2", label: "On your phone, open Google Maps → your listing → Photos → Add" },
      { id: "3", label: "Upload exteriors, completed work, team, and vans — avoid stock images" },
      { id: "4", label: "Add a short caption with the city or neighborhood when Google asks" },
      { id: "5", label: "Aim for 10+ total photos; re-check this audit in 7 days" },
    ];
  },
  "gbp.service_area_gaps": (insight) => {
    const have = Number(insight.evidence?.gbpZips ?? 0);
    const want = Number(insight.evidence?.expectedZips ?? 0);
    return [
      {
        id: "1",
        label: "List every ZIP you actually drive to (sales radius, not wish list)",
        detail: want ? `Target about ${want} ZIPs; GBP currently shows ${have}.` : undefined,
      },
      { id: "2", label: "Open GBP → Edit profile → Service area (or Locations you serve)" },
      { id: "3", label: "Add each missing ZIP; remove ZIPs you never serve" },
      { id: "4", label: "Save, then Google “your service + a missing ZIP” in an incognito window" },
      { id: "5", label: "If you don’t appear, add a city landing page or GBP post naming that area" },
    ];
  },
  "gbp.low_review_velocity": () => [
    { id: "1", label: "After every completed job, text a short review ask the same day" },
    { id: "2", label: "Use a direct Google review link (GBP → Get more reviews → Share)" },
    { id: "3", label: "Ask happy customers only — never incentive for a specific star rating" },
    { id: "4", label: "Reply to every new review within 48 hours (thank-yous count)" },
    { id: "5", label: "Track new reviews weekly until you hit 3+ in a rolling 90 days" },
  ],
  "gbp.rating_under_4_2": () => [
    { id: "1", label: "Reply to every 1–3★ review this week — calm, specific, offer to make it right" },
    { id: "2", label: "Fix the operational issues those reviews mention (late arrivals, pricing surprises)" },
    { id: "3", label: "Ramp positive review asks from 5★-likely customers after good jobs" },
    { id: "4", label: "Don’t delete bad reviews or argue in public" },
    { id: "5", label: "Re-check average rating monthly until you’re consistently above 4.2" },
  ],
  "nap.inconsistent": () => [
    { id: "1", label: "Write down the canonical Name, Address, Phone you’ll use everywhere" },
    { id: "2", label: "Update Google Business Profile first — that is the source of truth" },
    { id: "3", label: "Fix Yelp, BBB, Apple Maps, and your website footer to match exactly" },
    { id: "4", label: "Same punctuation and suite numbers — “St” vs “Street” matters" },
    { id: "5", label: "Re-run this audit in 2 weeks to confirm directories caught up" },
  ],
};

function defaultSteps(insight: Insight): ActionChecklistStep[] {
  return [
    { id: "1", label: insight.action },
    { id: "2", label: "Open Google Business Profile (business.google.com) and make the change" },
    { id: "3", label: "Save, wait a few minutes, then search your business on Google to verify" },
  ];
}

export function insightsToActionItems(insights: Insight[]): ActionItem[] {
  const actionable = insights.filter((i) => i.severity !== "win");
  const wins = insights.filter((i) => i.severity === "win");

  const items = actionable.map((insight) => {
    const stepsFn = CHECKLISTS[insight.id];
    return {
      id: insight.id,
      priority: PRIORITY_FROM_SEVERITY[insight.severity],
      severity: insight.severity,
      title: insight.title,
      why: insight.message,
      outcome: insight.action,
      steps: stepsFn ? stepsFn(insight) : defaultSteps(insight),
    } satisfies ActionItem;
  });

  // Critical first, then warning, then info
  const rank: Record<Insight["severity"], number> = {
    critical: 0,
    warning: 1,
    info: 2,
    win: 3,
  };
  items.sort((a, b) => rank[a.severity] - rank[b.severity]);

  // Wins as “keep going” at the end (collapsed by default in UI)
  for (const win of wins) {
    items.push({
      id: win.id,
      priority: "keep_going",
      severity: "win",
      title: win.title,
      why: win.message,
      outcome: win.action,
      steps: [{ id: "1", label: "No change needed — keep doing this." }],
    });
  }

  return items;
}
