/**
 * Skill: ga4_health_brief
 *
 * Pulls a window of GA4 metrics + the same-length prior window, runs the rule
 * engine, and emits a monthly client narrative. This is the "report your
 * landscaper actually opens" — short, dollars-and-jobs framed, no charts.
 *
 * Deterministic part:
 *   - Fetch current + prior windows
 *   - Build Ga4Comparison
 *   - Run ga4Insights -> Insight[]
 *
 * Narrative part:
 *   - Generate 3-section brief: what changed / what we did / what's next
 */
import { z } from "zod";

import { ga4Window } from "@/lib/connectors/google";
import { ga4Insights, type Ga4Window as RuleGa4Window } from "@/lib/skills/_shared/rule-engine";
import { narrative, type Usage } from "@/lib/skills/_shared/llm";
import { renderPlaybook } from "@/lib/skills/_shared/playbook";
import type { Connector, Site } from "@/lib/db/types";

// =============================================================================
// schemas
// =============================================================================

export const Input = z.object({
  windowDays: z.number().int().min(7).max(90).default(28),
});
// z.input lets callers omit fields with .default(); Input.parse() fills them in.
export type Input = z.input<typeof Input>;

const Window = z.object({
  sessions: z.number().int(),
  users: z.number().int(),
  bounceRate: z.number(),
  avgSessionDurationSec: z.number().int(),
  channels: z.record(z.number()),
});

const DeterministicOutput = z.object({
  windowDays: z.number().int(),
  current: Window,
  prior: Window,
  insights: z.array(z.object({
    id: z.string(),
    severity: z.enum(["critical", "warning", "info", "win"]),
    title: z.string(),
    message: z.string(),
    action: z.string(),
    evidence: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  })),
});
export type DeterministicOutput = z.infer<typeof DeterministicOutput>;

const NarrativeOutput = z.object({
  headline: z.string(),
  whatChanged: z.string(),
  whatWeDid: z.string(),
  whatsNext: z.string(),
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
  fixture?: { current: RuleGa4Window; prior: RuleGa4Window };
}

export async function runDeterministic(args: RunDeterministicArgs): Promise<DeterministicOutput> {
  const parsed = Input.parse(args);

  let current: RuleGa4Window;
  let prior: RuleGa4Window;

  if (args.fixture) {
    current = args.fixture.current;
    prior = args.fixture.prior;
  } else if (args.connector) {
    current = await ga4Window(args.connector, {
      startDate: `${parsed.windowDays}daysAgo`,
      endDate: "today",
    });
    prior = await ga4Window(args.connector, {
      startDate: `${parsed.windowDays * 2}daysAgo`,
      endDate: `${parsed.windowDays}daysAgo`,
    });
  } else {
    throw new Error("ga4_health_brief requires either `connector` or `fixture`");
  }

  const insights = ga4Insights({ current, prior });

  return DeterministicOutput.parse({
    windowDays: parsed.windowDays,
    current,
    prior,
    insights,
  });
}

// =============================================================================
// runNarrative
// =============================================================================

export async function runNarrative(args: {
  deterministic: DeterministicOutput;
  site: Site;
  /** Optional rolling-memory snippet to append before the narrative call. */
  memorySnippet?: string;
}): Promise<{ value: NarrativeOutput; usage: Usage }> {
  const playbook = args.memorySnippet
    ? renderPlaybook(args.site) + `\n\n## Memory snippet (since last report)\n${args.memorySnippet}\n`
    : renderPlaybook(args.site);

  return narrative({
    playbook,
    structured: args.deterministic,
    schema: NarrativeOutput,
    task:
      "Write the monthly health brief in three short sections (What changed / " +
      "What we did / What's next). Each section is 2-4 sentences. Do NOT cite " +
      "metrics that aren't in the structured input. Frame in dollars-and-jobs.",
  });
}

export async function run(args: RunDeterministicArgs & { site?: Site; withNarrative?: boolean; memorySnippet?: string }): Promise<SkillResult> {
  const deterministic = await runDeterministic(args);
  if (!args.withNarrative || !args.site) return { deterministic };
  const n = await runNarrative({ deterministic, site: args.site, memorySnippet: args.memorySnippet });
  return { deterministic, narrative: n.value, llmUsage: n.usage };
}
