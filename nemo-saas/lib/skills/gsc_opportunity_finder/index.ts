/**
 * Skill: gsc_opportunity_finder
 *
 * Pulls 90 days of Google Search Console data, finds queries with high
 * impressions stuck in positions 4–15 (the "almost ranking" band that
 * unlocks the most clicks per fix), dedupes by page, and proposes
 * title/H1 rewrites per page.
 *
 * Deterministic part:
 *   - Filter rows: position in [4, 15], impressions >= MIN_IMPR
 *   - Group by page; per page keep top N queries
 *   - Score = impressions * (target_ctr_at_pos_3 - current_ctr)
 *   - Output ranked list of (page, queries[], lift_estimate)
 *
 * Narrative part (per page):
 *   - Suggest 2 candidate titles + 1 H1 rewrite
 *
 * Verifier hooks:
 *   - tasks/gsc_opportunity_finder/* fixtures provide GSC export rows
 *     and assert specific (page, query) pairs appear in the output.
 */
import { z } from "zod";

import { gscQueryByPage, type GscQueryRow } from "@/lib/connectors/google";
import { narrative, type Usage } from "@/lib/skills/_shared/llm";
import { renderPlaybook } from "@/lib/skills/_shared/playbook";
import type { Connector, Site } from "@/lib/db/types";

const MIN_IMPRESSIONS = 100;
const MIN_POSITION = 4;
const MAX_POSITION = 15;
const TOP_QUERIES_PER_PAGE = 5;
// Approximate CTR by position; rough industry numbers, fine for ranking.
const CTR_BY_POSITION: Record<number, number> = {
  1: 0.32, 2: 0.18, 3: 0.11, 4: 0.08, 5: 0.06,
  6: 0.045, 7: 0.035, 8: 0.025, 9: 0.02, 10: 0.018,
};
const TARGET_POSITION = 3;

// =============================================================================
// schemas
// =============================================================================

export const Input = z.object({
  /** Either pass `connector` directly OR `rows` (for tests / Harbor fixtures). */
  startDate: z.string().describe("YYYY-MM-DD or '90daysAgo'").default("90daysAgo"),
  endDate: z.string().default("today"),
  rowLimit: z.number().int().min(1).max(25_000).default(5_000),
});
// z.input lets callers omit fields with .default(); Input.parse() fills them in.
export type Input = z.input<typeof Input>;

const Opportunity = z.object({
  page: z.string(),
  queries: z.array(z.object({
    query: z.string(),
    impressions: z.number().int(),
    clicks: z.number().int(),
    position: z.number(),
    ctr: z.number(),
  })),
  totalImpressions: z.number().int(),
  estimatedMonthlyClickLift: z.number().int(),
});

const DeterministicOutput = z.object({
  windowStart: z.string(),
  windowEnd: z.string(),
  totalRows: z.number().int(),
  opportunities: z.array(Opportunity),
});
export type DeterministicOutput = z.infer<typeof DeterministicOutput>;

const Rewrites = z.object({
  page: z.string(),
  candidateTitles: z.array(z.string()).min(1).max(3),
  candidateH1: z.string(),
  reasoning: z.string(),
});

const NarrativeOutput = z.object({
  rewrites: z.array(Rewrites),
});
export type NarrativeOutput = z.infer<typeof NarrativeOutput>;

export interface SkillResult {
  deterministic: DeterministicOutput;
  narrative?: NarrativeOutput;
  llmUsage?: Usage;
}

// =============================================================================
// runDeterministic
// =============================================================================

export interface RunDeterministicArgs extends Input {
  /** Provide one of these. */
  connector?: Connector;
  rows?: GscQueryRow[];
}

export async function runDeterministic(args: RunDeterministicArgs): Promise<DeterministicOutput> {
  const parsed = Input.parse(args);
  const rows = args.rows ?? (
    args.connector
      ? await gscQueryByPage(args.connector, {
          startDate: parsed.startDate,
          endDate: parsed.endDate,
          rowLimit: parsed.rowLimit,
        })
      : []
  );

  const candidates = rows.filter(
    (r) => r.impressions >= MIN_IMPRESSIONS && r.position >= MIN_POSITION && r.position <= MAX_POSITION,
  );

  const byPage = new Map<string, GscQueryRow[]>();
  for (const r of candidates) {
    const list = byPage.get(r.page) ?? [];
    list.push(r);
    byPage.set(r.page, list);
  }

  const opportunities: z.infer<typeof Opportunity>[] = [];
  for (const [page, list] of byPage) {
    list.sort((a, b) => b.impressions - a.impressions);
    const top = list.slice(0, TOP_QUERIES_PER_PAGE);
    const totalImpressions = top.reduce((s, r) => s + r.impressions, 0);
    const lift = top.reduce((s, r) => {
      const targetCtr = CTR_BY_POSITION[TARGET_POSITION] ?? 0.11;
      const delta = Math.max(0, targetCtr - (r.ctr || ctrForPosition(r.position)));
      return s + r.impressions * delta;
    }, 0);
    opportunities.push({
      page,
      queries: top.map((r) => ({
        query: r.query, impressions: r.impressions, clicks: r.clicks, position: r.position, ctr: r.ctr,
      })),
      totalImpressions,
      // GSC reports a 90-day window; convert to approximate monthly lift.
      estimatedMonthlyClickLift: Math.round(lift / 3),
    });
  }
  opportunities.sort((a, b) => b.estimatedMonthlyClickLift - a.estimatedMonthlyClickLift);

  return DeterministicOutput.parse({
    windowStart: parsed.startDate,
    windowEnd: parsed.endDate,
    totalRows: rows.length,
    opportunities: opportunities.slice(0, 25),
  });
}

// =============================================================================
// runNarrative
// =============================================================================

export async function runNarrative(args: {
  deterministic: DeterministicOutput;
  site: Site;
  /** Cap LLM cost: only rewrite the top N pages per run. */
  topN?: number;
}): Promise<{ value: NarrativeOutput; usage: Usage }> {
  const playbook = renderPlaybook(args.site);
  const limited = {
    ...args.deterministic,
    opportunities: args.deterministic.opportunities.slice(0, args.topN ?? 10),
  };
  return narrative({
    playbook,
    structured: limited,
    schema: NarrativeOutput,
    task:
      "For each page in the structured input, propose 2 candidate <title> rewrites " +
      "and 1 H1 rewrite that target the listed queries while staying under 60 chars. " +
      "Reasoning must reference the actual queries (no generic SEO platitudes).",
  });
}

export async function run(args: RunDeterministicArgs & { site?: Site; withNarrative?: boolean }): Promise<SkillResult> {
  const deterministic = await runDeterministic(args);
  if (!args.withNarrative || !args.site) return { deterministic };
  const n = await runNarrative({ deterministic, site: args.site });
  return { deterministic, narrative: n.value, llmUsage: n.usage };
}

function ctrForPosition(position: number): number {
  const floor = Math.floor(position);
  const cap = Math.min(10, Math.max(1, floor));
  return CTR_BY_POSITION[cap] ?? 0.01;
}
