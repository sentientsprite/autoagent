/**
 * Deterministic weekly pSEO draft stubs for the sales pipeline.
 * No LLM — operators expand against pseo-page-template before publish.
 */
export type ContentDraftStub = {
  channel: string;
  title: string;
  body_md: string;
  meta: Record<string, unknown>;
};

const TRIPLES: Array<{ niche: string; city: string; state: string; intent: string }> = [
  { niche: "concrete sealing", city: "Salt Lake City", state: "UT", intent: "Maps visibility" },
  { niche: "plumbing", city: "West Jordan", state: "UT", intent: "Google Maps" },
  { niche: "HVAC", city: "Draper", state: "UT", intent: "local search" },
  { niche: "electrical", city: "South Jordan", state: "UT", intent: "Maps pack" },
  { niche: "concrete coating", city: "Boise", state: "ID", intent: "Google Maps" },
];

export function mondayWeekStart(d = new Date()): string {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setUTCDate(x.getUTCDate() + diff);
  return x.toISOString().slice(0, 10);
}

export function buildWeeklyContentDrafts(weekStart: string): ContentDraftStub[] {
  return TRIPLES.map((t) => {
    const title = `${t.city} ${t.niche}: why you're invisible on ${t.intent}`;
    const slug = `${t.state.toLowerCase()}-${t.city.toLowerCase().replace(/\s+/g, "-")}-${t.niche.replace(/\s+/g, "-")}`;
    const body_md = [
      `# ${title}`,
      "",
      `> Draft stub for week of ${weekStart}. Expand with [[pseo-page-template]] quality gate before publish.`,
      "",
      `**Triple:** ${t.niche} × ${t.city}, ${t.state} × ${t.intent}`,
      "",
      "## Direct answer (fill)",
      "Two–three sentences: what local owners miss on Maps / organic for this niche.",
      "",
      "## Checklist (5)",
      "1. Primary GBP category",
      "2. NAP consistency",
      "3. Services list",
      "4. Review velocity",
      "5. Website URL on GBP (service page, not fluff homepage)",
      "",
      "## CTA",
      `Local Visibility Score → https://nemo-app-v-1.vercel.app/?utm_source=pseo&utm_medium=content_draft&utm_campaign=${encodeURIComponent(slug)}`,
      "",
      "No automated GBP changes. Operator stays in control.",
    ].join("\n");

    return {
      channel: "pseo",
      title,
      body_md,
      meta: {
        niche: t.niche,
        city: t.city,
        state: t.state,
        intent: t.intent,
        week_start: weekStart,
        template: "pseo-page-template",
      },
    };
  });
}
