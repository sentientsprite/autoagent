/**
 * Home-services SEO/GEO/AEO baseline — productized from the vault playbook
 * (`home-services-seo` / `seo-geo-checklist`).
 *
 * Rendered into every starter CLIENT.md so delivery, agents, and weekly briefs
 * score work against named phases instead of ad-hoc keyword lists.
 */

export type BaselineStatus = "todo" | "doing" | "done" | "blocked" | "na";

export type BaselinePhaseId = 1 | 2 | 3 | 4;

export interface BaselineItem {
  id: string;
  phase: BaselinePhaseId;
  label: string;
  /** Optional LVS insight ids that evidence this checklist item. */
  lvsInsightIds?: string[];
}

export const SEO_GEO_BASELINE_ITEMS: BaselineItem[] = [
  // Phase 1 — Technical entity alignment
  { id: "p1.inp", phase: 1, label: "Validate mobile INP under 200ms" },
  { id: "p1.jsonld", phase: 1, label: "Deploy trade-specific JSON-LD (not generic LocalBusiness)" },
  { id: "p1.wikidata", phase: 1, label: "Link entity via Wikidata / sameAs" },
  { id: "p1.geocoords", phase: 1, label: "Implement GeoCoordinates in markup" },
  { id: "p1.offer_catalog", phase: 1, label: "Nest service & offer catalogs (hasOfferCatalog)" },
  { id: "p1.ai_robots", phase: 1, label: "Allow AI crawlers in robots.txt (GPTBot, Google-Extended, etc.)" },

  // Phase 2 — Organic authority & answer-first content
  { id: "p2.service_pages", phase: 2, label: "Intent-focused service pages (800–1,500 words each)" },
  { id: "p2.first_30", phase: 2, label: "Put specific claims/answers in the first 30% of page text" },
  { id: "p2.chunks", phase: 2, label: "≤500-token answer chunks under question/entity H2s" },
  { id: "p2.jetstream", phase: 2, label: "Jetstream patterns (Best for… / X vs Y) on major sections" },
  { id: "p2.gbp_service_link", phase: 2, label: "Link GBP to a high-value service page (not only homepage)" },
  { id: "p2.non_commodity", phase: 2, label: "Localized cost guides + material comparisons" },
  { id: "p2.youtube", phase: 2, label: "Tier-1 YouTube how-tos with transcripts + chapters" },

  // Phase 3 — Local Map Pack & GBP (LVS-mappable)
  {
    id: "p3.primary_category",
    phase: 3,
    label: "Audit primary GBP category (most specific correct category)",
    lvsInsightIds: ["gbp.wrong_category", "gbp.category_ok"],
  },
  {
    id: "p3.hours",
    phase: 3,
    label: "Hours 100% accurate / openness optimized",
    lvsInsightIds: ["gbp.profile_incomplete"],
  },
  {
    id: "p3.photos",
    phase: 3,
    label: "2–3 fresh non-stock jobsite photos weekly (Vision AI feed)",
    lvsInsightIds: ["gbp.thin_photos"],
  },
  {
    id: "p3.services",
    phase: 3,
    label: "Seed GBP Services tab with every relevant service",
    lvsInsightIds: ["gbp.service_area_gaps", "gbp.profile_incomplete"],
  },
  {
    id: "p3.review_response",
    phase: 3,
    label: "≥90% review response rate within 24h",
    lvsInsightIds: ["gbp.low_review_velocity", "gbp.rating_under_4_2"],
  },

  // Phase 4 — GEO & off-site digital PR
  { id: "p4.best_of", phase: 4, label: "Earn local “Best Of” / industry list placements" },
  { id: "p4.nap", phase: 4, label: "NAP character-perfect across Google, Apple, Bing, Facebook" },
  { id: "p4.aggregators", phase: 4, label: "Claim/complete Yelp, Angi, Thumbtack, Houzz" },
  { id: "p4.reddit", phase: 4, label: "Named-entity Reddit engagement in local/trade subs" },
];

const PHASE_TITLES: Record<BaselinePhaseId, string> = {
  1: "Phase 1 — Technical entity alignment",
  2: "Phase 2 — Organic authority & answer-first content",
  3: "Phase 3 — Local Map Pack & GBP",
  4: "Phase 4 — GEO & off-site digital PR",
};

const TRADE_OVERLAYS: Record<string, string> = {
  hvac: "Seasonal sequencing — SEER/maintenance content in off-season so pages age before demand spikes.",
  plumber: "Emergency intent — high-AOV lines (repipe, tankless) get separate schema + emergency GBP attributes.",
  plumbing: "Emergency intent — high-AOV lines (repipe, tankless) get separate schema + emergency GBP attributes.",
  electrician: "EV charging lane — parent/child page structures for residential + commercial EV charging.",
  electrical: "EV charging lane — parent/child page structures for residential + commercial EV charging.",
  concrete: "Visual proof — portfolio galleries with AggregateRating + ImageObject for long consideration cycles.",
};

export function tradeOverlayForCategory(category: string | null | undefined): string {
  if (!category?.trim()) {
    return "Open question: confirm trade so we can apply the HVAC / plumbing / electrical / concrete overlay.";
  }
  const key = category.toLowerCase();
  for (const [needle, overlay] of Object.entries(TRADE_OVERLAYS)) {
    if (key.includes(needle)) return overlay;
  }
  return `No canned overlay for “${category}” yet — use the generic four-phase baseline and note trade-specific tests under Current Beliefs.`;
}

function statusCheckbox(status: BaselineStatus): string {
  switch (status) {
    case "done":
      return "[x]";
    case "doing":
      return "[~]";
    case "blocked":
      return "[!]";
    case "na":
      return "[-]";
    case "todo":
    default:
      return "[ ]";
  }
}

export function renderSeoGeoBaselineSection(args: {
  primaryCategory?: string | null;
  /** Per-item status overrides; defaults to todo. */
  statuses?: Partial<Record<string, BaselineStatus>>;
}): string {
  const statuses = args.statuses ?? {};
  const lines: string[] = [
    "## SEO/GEO Baseline (2026)",
    "",
    "Canonical home-services playbook for single-location clients. Status: `[ ]` todo · `[~]` doing · `[x]` done · `[!]` blocked · `[-]` n/a.",
    "Do not invent completion — leave Open Questions when unknown. Phase 3 is updated from Local Visibility audits when evidence exists.",
    "",
  ];

  for (const phase of [1, 2, 3, 4] as BaselinePhaseId[]) {
    lines.push(`### ${PHASE_TITLES[phase]}`);
    for (const item of SEO_GEO_BASELINE_ITEMS.filter((i) => i.phase === phase)) {
      const st = statuses[item.id] ?? "todo";
      lines.push(`- ${statusCheckbox(st)} \`${item.id}\` — ${item.label}`);
    }
    lines.push("");
  }

  lines.push("### Trade overlay");
  lines.push(`- ${tradeOverlayForCategory(args.primaryCategory)}`);
  lines.push("");
  lines.push("### Baseline KPIs");
  lines.push("- AI Visibility Score: open question (Citation Gap / GeoGrid not yet productized).");
  lines.push("- TARP (service-area GeoGrid): open question.");
  lines.push("- Review velocity: target 15–30 new reviews/month — confirm current rate.");
  lines.push("- High-intent actions: GBP calls + directions + quote forms — wire tracking.");
  lines.push("");

  return lines.join("\n");
}

/**
 * Map LVS insight ids → Phase 3 checklist statuses.
 * Critical/warning insights mean the item is still open (todo); wins/absence of
 * a matching insight leave status unchanged (caller starts from prior md).
 */
export function phase3StatusesFromLvsInsights(
  insightIds: string[],
): Partial<Record<string, BaselineStatus>> {
  const fired = new Set(insightIds);
  const out: Partial<Record<string, BaselineStatus>> = {};

  for (const item of SEO_GEO_BASELINE_ITEMS.filter((i) => i.phase === 3)) {
    const ids = item.lvsInsightIds ?? [];
    if (!ids.length) continue;

    const bad = ids.filter((id) => !id.endsWith("_ok") && !id.includes("win"));
    const good = ids.filter((id) => id.endsWith("_ok") || id.includes("win"));

    if (bad.some((id) => fired.has(id))) {
      out[item.id] = "todo";
    } else if (good.some((id) => fired.has(id))) {
      out[item.id] = "done";
    } else if (item.id === "p3.primary_category" && !fired.has("gbp.not_found") && !fired.has("gbp.lookup_unavailable")) {
      // Place found and no category defect fired → treat as provisionally done.
      out[item.id] = "done";
    }
  }

  // If GBP missing entirely, mark Phase 3 items blocked until Places works.
  if (fired.has("gbp.not_found") || fired.has("gbp.lookup_unavailable")) {
    for (const item of SEO_GEO_BASELINE_ITEMS.filter((i) => i.phase === 3)) {
      out[item.id] = "blocked";
    }
  }

  return out;
}

/**
 * Replace or insert the SEO/GEO Baseline section in an existing CLIENT.md.
 * Preserves surrounding sections.
 */
export function upsertSeoGeoBaselineSection(
  clientMd: string,
  sectionBody: string,
): string {
  const marker = "## SEO/GEO Baseline (2026)";
  const trimmedSection = sectionBody.trimEnd() + "\n";
  const idx = clientMd.indexOf(marker);
  if (idx === -1) {
    // Insert before Open Questions when present; else append.
    const oq = clientMd.indexOf("## Open Questions");
    if (oq === -1) return `${clientMd.trimEnd()}\n\n${trimmedSection}`;
    return `${clientMd.slice(0, oq).trimEnd()}\n\n${trimmedSection}\n${clientMd.slice(oq).trimStart()}`;
  }

  const after = clientMd.indexOf("\n## ", idx + marker.length);
  if (after === -1) {
    return `${clientMd.slice(0, idx).trimEnd()}\n\n${trimmedSection}`;
  }
  return `${clientMd.slice(0, idx).trimEnd()}\n\n${trimmedSection}\n${clientMd.slice(after).trimStart()}`;
}

/** Apply status overrides onto an existing baseline section by rewriting checkboxes for known ids. */
export function applyBaselineStatusesToClientMd(
  clientMd: string,
  statuses: Partial<Record<string, BaselineStatus>>,
): string {
  if (!Object.keys(statuses).length) return clientMd;
  let next = clientMd;
  for (const [id, status] of Object.entries(statuses)) {
    if (!status) continue;
    const re = new RegExp(`(- \\[[ x~!\\-]\\] \`${id}\` —)`);
    next = next.replace(re, `- ${statusCheckbox(status)} \`${id}\` —`);
  }
  return next;
}
