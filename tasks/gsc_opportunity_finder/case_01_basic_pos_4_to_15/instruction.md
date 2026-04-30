# Task: gsc_opportunity_finder — case_01

You are running the `gsc_opportunity_finder` skill on a fixture GSC export.

## What to do

1. Read `/task/files/input.json` — array of `GscQueryRow`:
   `{ query, page, clicks, impressions, ctr, position }`.
2. Find queries where `impressions >= 100` AND `position >= 4` AND `position <= 15`.
3. Group by `page`, keep top 5 queries per page (sorted by impressions desc).
4. Compute `estimatedMonthlyClickLift` per page = sum over kept queries of
   `impressions * max(0, target_ctr - current_ctr) / 3` where
   `target_ctr = 0.11` (CTR at position 3). Round to int.
5. Sort opportunities by `estimatedMonthlyClickLift` desc; keep top 25.
6. Write to `/task/output.json`:

```json
{
  "opportunities": [
    {
      "page": "https://...",
      "queries": [{"query":"...","impressions":N,"clicks":N,"position":N,"ctr":N}],
      "totalImpressions": N,
      "estimatedMonthlyClickLift": N
    }
  ]
}
```

The verifier checks that the expected top-lift page appears first.
