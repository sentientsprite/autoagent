# Skill: `gsc_opportunity_finder`

Finds the "almost ranking" queries that unlock the most clicks per fix.

## Why this skill

For SMBs the highest-leverage SEO win is rarely "rank #1 for a hard keyword".
It's "this page is already on page 1 (positions 4–15) for a high-impression
query — rewrite the title and you'll capture 2–3x the clicks". This skill
finds those automatically.

## Inputs

```ts
{
  startDate: '90daysAgo',
  endDate: 'today',
  rowLimit: 5000,
  connector?: Connector;     // GSC OAuth — required in prod
  rows?: GscQueryRow[];      // for tests/Harbor fixtures
}
```

## Output (deterministic)

```ts
{
  windowStart, windowEnd, totalRows: number;
  opportunities: Array<{
    page: string;
    queries: Array<{ query, impressions, clicks, position, ctr }>;
    totalImpressions: number;
    estimatedMonthlyClickLift: number;
  }>;
}
```

## Output (narrative)

```ts
{
  rewrites: Array<{
    page: string;
    candidateTitles: string[];   // 1..3
    candidateH1: string;
    reasoning: string;
  }>;
}
```

## Tool allowlist

| Capability | Used? |
|---|---|
| Search Console API (`webmasters.readonly`) | yes |
| Crawler / Playwright | no |
| LLM call | optional (narrative step only) |

## Verifier hooks

`tasks/gsc_opportunity_finder/case_*` ships fixture GSC exports and asserts:

- the right (page, query) pairs appear at the top
- queries below `MIN_IMPRESSIONS` or outside `[MIN_POSITION, MAX_POSITION]` do NOT appear
- `estimatedMonthlyClickLift` is monotonically decreasing across `opportunities`

## Cost / latency

- Deterministic: < 1s on 5k rows.
- Narrative: ~2s per page; capped at top 10 pages = 1 batched LLM call.

## Harbor SkillEval

Deterministic Harbor path (local models):

```bash
python3 /task/_shared/gsc_apply_rules.py
# reads /task/files/input.json → writes /task/output.json
```

Host source: `tasks/_shared/gsc_apply_rules.py` (vendored into each case `tests/_shared` by `scripts/run-skilleval.sh`). Agent `SYSTEM_PROMPT` points `gsc_opportunity_finder` tasks at this script (above FIXED ADAPTER BOUNDARY).

