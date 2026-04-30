# Skill: `ga4_health_brief`

The "monthly report your landscaper actually opens." Short, no charts, framed
in dollars-and-jobs.

## Inputs

```ts
{
  windowDays: number;        // 7..90, default 28
  connector?: Connector;     // GA4 OAuth — required in prod
  fixture?: { current: Ga4Window; prior: Ga4Window };  // tests/Harbor
}
```

## Output (deterministic)

```ts
{
  windowDays, current, prior,
  insights: Insight[]   // from rule engine
}
```

## Output (narrative)

```ts
{
  headline: string;
  whatChanged: string;
  whatWeDid: string;
  whatsNext: string;
}
```

## Tool allowlist

| Capability | Used? |
|---|---|
| GA4 Data API (`analytics.readonly`) | yes |
| LLM call | yes (narrative) |
| Crawler | no |

## Rolling memory

This skill optionally takes a `memorySnippet` string that's appended to the
playbook before the LLM call. The Inngest reporter step builds this snippet
from the prior `ga4_health_brief` job's output ("last month organic was 12%
of sessions, this month it's 18%"). This is the nemo-workspace MEMORY.md
pattern in production.

## Verifier hooks

`tasks/ga4_health_brief/case_*` ships fixture comparisons and asserts:

- `ga.traffic_drop` fires when sessions drop ≥15% (e.g. case_01)
- `ga.high_bounce` fires when bounce ≥0.6 (e.g. case_02)
- `ga.ad_waste` fires when paid share >0.3 AND bounce ≥0.55 (e.g. case_03)
- the narrative rubric task scores story coherence and accuracy
