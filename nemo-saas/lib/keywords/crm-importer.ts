/**
 * Phase 2 keyword strategy — two-sheet template (BG layout, brand-agnostic).
 *
 * Sheet A — Input Data (authoring):
 *   Base URL · City list · Topics + URL paths · Keyphrase buckets
 *
 * Sheet B — CRM Export (build + LVS):
 *   topic | landingUrl (needle) | keyPhrases[] (from pipe-separated key_phrase)
 *
 * Expansion rule:
 *   for each (city × topic):
 *     landing = baseUrl + citySlug + urlPath
 *     phrases = bucketPhrases.map(p => `${p} ${city}`)
 *
 * Fixture: fixtures/keywords/page-keyword-strategy.template.json
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

export const KeywordRow = z.object({
  topic: z.string(),
  landingUrl: z.string().url().nullable().optional(),
  keyPhrases: z.array(z.string().min(1)).min(1),
});
export type KeywordRow = z.infer<typeof KeywordRow>;

/** Build-ready export pack (Sheet B). */
export const KeywordPack = z.object({
  /** Optional label for the client/job — not a multi-brand registry. */
  label: z.string().optional(),
  rows: z.array(KeywordRow),
  rowCount: z.number().int().optional(),
  phraseCount: z.number().int().optional(),
});
export type KeywordPack = z.infer<typeof KeywordPack>;

/** Authoring surface (Sheet A). */
export const KeywordInputData = z.object({
  baseUrl: z.string().url(),
  cities: z.array(z.string().min(2)),
  topics: z.array(
    z.object({
      topic: z.string().min(2),
      urlPath: z.string().optional(),
    }),
  ),
  /** Bucket name → seed phrases (before city append). */
  keyphraseBuckets: z.record(z.array(z.string())),
});
export type KeywordInputData = z.infer<typeof KeywordInputData>;

export const TargetKeyword = z.object({
  phrase: z.string().min(2),
  topic: z.string().optional(),
  landingUrl: z.string().url().optional(),
});
export type TargetKeyword = z.infer<typeof TargetKeyword>;

/** Flatten export pack → unique target keywords (cap for LVS cost). */
export function flattenTargetKeywords(
  pack: KeywordPack,
  opts?: { max?: number; topicIncludes?: string },
): TargetKeyword[] {
  const max = opts?.max ?? 40;
  const filter = opts?.topicIncludes?.toLowerCase();
  const seen = new Set<string>();
  const out: TargetKeyword[] = [];
  for (const row of pack.rows) {
    if (filter && !row.topic.toLowerCase().includes(filter)) continue;
    for (const phrase of row.keyPhrases) {
      const key = phrase.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      out.push({
        phrase: phrase.trim(),
        topic: row.topic,
        landingUrl: row.landingUrl ?? undefined,
      });
      if (out.length >= max) return out;
    }
  }
  return out;
}

/**
 * Expand Sheet A → Sheet B rows (city × topic).
 * Does not slugify cities beyond a simple kebab — production may use a better slugger.
 */
export function expandInputToExport(input: KeywordInputData): KeywordPack {
  const rows: KeywordRow[] = [];
  const base = input.baseUrl.endsWith("/") ? input.baseUrl : `${input.baseUrl}/`;

  for (const city of input.cities) {
    for (const t of input.topics) {
      const bucket =
        input.keyphraseBuckets[t.topic] ??
        input.keyphraseBuckets[t.topic.toLowerCase()] ??
        Object.values(input.keyphraseBuckets)[0] ??
        [];
      const phrases = bucket.map((p) => `${p} ${city}`.trim()).filter(Boolean);
      if (!phrases.length) continue;
      const slug = city
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const path = (t.urlPath || "").replace(/^\//, "");
      rows.push({
        topic: `${t.topic} ${city}`,
        landingUrl: `${base}${slug}/${path}`,
        keyPhrases: phrases,
      });
    }
  }

  return {
    rows,
    rowCount: rows.length,
    phraseCount: rows.reduce((n, r) => n + r.keyPhrases.length, 0),
  };
}


/** Non-prod helper: load BG-template export fixture (not a multi-brand registry). */
export function loadKeywordStrategyExport(): KeywordPack {
  const path = join(
    process.cwd(),
    "fixtures",
    "keywords",
    "page-keyword-strategy.export.json",
  );
  const raw = JSON.parse(readFileSync(path, "utf8"));
  return KeywordPack.parse(raw);
}

/** Flatten template export into LVS targetKeywords (capped). */
export function targetKeywordsFromStrategyExport(
  opts?: { max?: number; topicIncludes?: string },
): TargetKeyword[] {
  return flattenTargetKeywords(loadKeywordStrategyExport(), opts);
}

/**
 * Cheap Phase-2 signal: does site HTML contain the phrase (case-insensitive)?
 * Not a rank check — that is Phase 2b (Serper / local pack).
 */
export function keywordPresenceInsights(
  htmlOrText: string,
  keywords: TargetKeyword[],
): {
  id: string;
  severity: "critical" | "warning" | "info" | "win";
  title: string;
  message: string;
  action: string;
  evidence?: Record<string, string | number | boolean>;
}[] {
  const body = (htmlOrText || "").toLowerCase();
  if (!keywords.length || !body) return [];

  let hit = 0;
  const missing: string[] = [];
  for (const kw of keywords) {
    if (body.includes(kw.phrase.toLowerCase())) hit += 1;
    else if (missing.length < 8) missing.push(kw.phrase);
  }
  const total = keywords.length;
  const coverage = hit / total;
  const out: ReturnType<typeof keywordPresenceInsights> = [];

  if (coverage >= 0.6) {
    out.push({
      id: "kw.onpage_coverage_ok",
      severity: "win",
      title: "Target keywords appear on-page",
      message: `${hit}/${total} strategy phrases found in site text (${Math.round(coverage * 100)}%).`,
      action: "Keep service pages aligned to the keyword strategy topics.",
      evidence: { hit, total, coverage },
    });
  } else if (coverage >= 0.25) {
    out.push({
      id: "kw.onpage_coverage_thin",
      severity: "warning",
      title: "Thin coverage of target keywords",
      message: `Only ${hit}/${total} phrases found on-site. Missing e.g. ${missing.slice(0, 3).join("; ")}.`,
      action: "Expand service pages with intent-focused H2s from the strategy topics.",
      evidence: { hit, total, coverage },
    });
  } else {
    out.push({
      id: "kw.onpage_coverage_low",
      severity: "critical",
      title: "Strategy keywords barely present on-site",
      message: `${hit}/${total} phrases found. Site copy is not matching the keyword sheet.`,
      action: "Ship Phase-2 service pages from strategy topics before chasing Map Pack for those terms.",
      evidence: { hit, total, coverage },
    });
  }

  if (missing.length) {
    out.push({
      id: "kw.missing_phrases",
      severity: "info",
      title: "Priority missing phrases",
      message: missing.slice(0, 5).join(" · "),
      action: "Add one service or city page that targets these phrases naturally.",
      evidence: { missingCount: missing.length },
    });
  }

  return out;
}
