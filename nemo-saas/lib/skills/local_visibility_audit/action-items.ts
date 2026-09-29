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
  "gbp.lookup_unavailable": () => [
    {
      id: "1",
      label: "This finding is about our lookup tool, not your business — we didn’t search Google yet",
    },
    {
      id: "2",
      label: "If you already have a Google Business Profile, nothing is wrong with it based on this result",
    },
    {
      id: "3",
      label: "Optional: open business.google.com and confirm your listing is claimed and verified",
    },
    {
      id: "4",
      label: "Ask us to re-run once live Google Places lookup is enabled for fuller GBP scoring",
    },
  ],
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
  "gbp.local_presence_ok": (insight) => [
    {
      id: "1",
      label: `You’re inside the ${insight.evidence?.radiusMi ?? 25}-mile local market — keep the pin + service area honest`,
    },
    { id: "2", label: "Post one Google update naming a nearby city you actually serve this week" },
    { id: "3", label: "Add 3 job photos tagged to recent work in that city" },
  ],
  "gbp.outside_local_radius": (insight) => [
    {
      id: "1",
      label: `Confirm the city you want to win (${insight.evidence?.city ?? "your city"}) matches where the truck works`,
    },
    { id: "2", label: "In GBP → Info, set service area / location pin for that city (not a far warehouse)" },
    { id: "3", label: "Re-run this audit with the city name locals search" },
    { id: "4", label: "If you serve multiple cities, pick the primary market first — don’t dilute the pin" },
  ],
  "gbp.local_competition": (insight) => [
    {
      id: "1",
      label: `Open Maps and skim the ${insight.evidence?.competitorCount ?? "nearby"} peers in your category`,
    },
    { id: "2", label: "Match or beat them on category accuracy, photo count, and review replies" },
    { id: "3", label: "Skip buying random citations — fix the listing first" },
  ],
  "gbp.thin_local_category": () => [
    { id: "1", label: "Open GBP → Category and set the most specific primary type customers search" },
    { id: "2", label: "Add secondary categories only if you really offer them" },
    { id: "3", label: "Re-run the audit — peers should appear once the type is right" },
  ],
  "gbp.behind_local_ratings": () => [
    { id: "1", label: "Reply to every open review this week" },
    { id: "2", label: "Ask three recent happy customers for a Google review today" },
    { id: "3", label: "Fix any operational complaints that keep repeating" },
  ],
  "gbp.behind_local_review_volume": () => [
    { id: "1", label: "Create a one-tap Google review link from GBP" },
    { id: "2", label: "Text it after every completed job for two weeks" },
    { id: "3", label: "Stop when you clear the local peer median" },
  ],
  "nap.inconsistent": () => [
    { id: "1", label: "Write down the canonical Name, Address, Phone you’ll use everywhere" },
    { id: "2", label: "Update Google Business Profile first — that is the source of truth" },
    { id: "3", label: "Fix Yelp, BBB, Apple Maps, and your website footer to match exactly" },
    { id: "4", label: "Same punctuation and suite numbers — “St” vs “Street” matters" },
    { id: "5", label: "Re-run this audit in 2 weeks to confirm directories caught up" },
  ],
  "schema.localbusiness_missing": () => [
    { id: "1", label: "Copy your exact GBP name, phone, and address (or areaServed cities) into a notepad" },
    { id: "2", label: "Add JSON-LD LocalBusiness (or ProfessionalService) on the homepage + main service page" },
    { id: "3", label: "Match telephone / url / address fields to GBP character-for-character — no tracking numbers in schema" },
    { id: "4", label: "Validate with Google’s Rich Results Test, then re-run this audit" },
  ],
  "schema.localbusiness_ok": () => [
    { id: "1", label: "Re-check schema NAP whenever you change phone or move — keep it identical to GBP" },
  ],
  "kw.onpage_coverage_low": () => [
    { id: "1", label: "Open your CRM keyword sheet (topic → key_phrase) and pick the top 5 service topics" },
    { id: "2", label: "For each topic, ship or expand an intent-focused service page (800–1,500 words)" },
    { id: "3", label: "Use H2s that match the CRM phrases naturally — no stuffing" },
    { id: "4", label: "Link GBP primary website to your best service page, not only the homepage" },
    { id: "5", label: "Re-run LVS with the same keyword pack to confirm coverage rose" },
  ],
  "kw.onpage_coverage_thin": () => [
    { id: "1", label: "List the missing CRM phrases from this audit" },
    { id: "2", label: "Add one city+service section or FAQ that covers the top missing phrases" },
    { id: "3", label: "Update internal links from homepage → that service page" },
  ],
  "kw.onpage_coverage_ok": () => [
    { id: "1", label: "Keep CRM topics and on-page copy in sync when you add cities" },
  ],
  "kw.missing_phrases": () => [
    { id: "1", label: "Pick the first 3 missing phrases and add them as H2s or FAQ answers" },
    { id: "2", label: "Publish the page, then re-audit" },
  ],
  "kw.site_fetch_failed": () => [
    { id: "1", label: "Confirm the website URL loads in a browser" },
    { id: "2", label: "Re-run the audit; keyword check needs a reachable site" },
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
