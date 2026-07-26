# Skill: `local_visibility_audit`

The wedge skill. Runs synchronously in the public Local Visibility Score
landing page and weekly for paid `local_autopilot` tenants.

## Inputs (Zod)

```ts
{
  businessName: string;          // required
  zip: string;                   // 5 or 9 digit
  city?: string;
  region?: string;
  websiteUrl?: string;           // enables NAP check
  expectedServiceAreaZipCount?: number;
  reviewsLast90d?: number;       // wedge estimates if absent
}
```

## Output (deterministic)

```ts
{
  grade: 'A'|'B'|'C'|'D'|'F';
  score: number;                 // 0..100
  insights: Insight[];           // stable rule ids, see _shared/rule-engine
  evidence: {
    placeFound: boolean;
    placesLookupConfigured: boolean; // false when GOOGLE_MAPS_API_KEY unset
    placeId?: string;
    rating?: number;
    reviewCount?: number;
    photoCount?: number;
    napDirectoriesChecked: number;
  };
}
```

When `placesLookupConfigured` is false the skill fires `gbp.lookup_unavailable`
(info) — not `gbp.not_found` (that only fires after a real Places search misses).
## Output (narrative, optional)

```ts
{
  headline: string;
  summary: string;
  topFixes: Array<{ insightId: string; title: string; why: string; do_this: string }>; // max 3
}
```

## Tool allowlist

| Capability | Used? | Why |
|---|---|---|
| Google Places API | yes | Public GBP-equivalent profile, no user OAuth |
| Crawler / Playwright | yes | Yelp/BBB/YellowPages directory presence |
| GBP Management API | no | Requires user OAuth — paid tier only, separate skill update later |
| LLM call | optional | Narrative summary on top of structured Insights |

## Verifier hooks

`tasks/local_visibility_audit/case_*` provide fixture inputs and assert that
specific rule ids fire in `insights[]`. The narrative step is judged by a
separate rubric task that runs less frequently.

## Cost / latency targets

- Deterministic step: < 4 seconds end-to-end (Places + 3 directory snapshots in parallel)
- Narrative step: < 6 seconds with `gpt-4o-mini`
- Total wedge response time: < 10 seconds (synchronous on the landing page)
