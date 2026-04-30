# Task: ga4_health_brief — case_01

Read `/task/files/input.json` (a `Ga4Comparison` with `current` and `prior` windows)
and emit which `Insight` ids should fire.

## Rules (subset relevant)

| Rule id | Fires when |
|---|---|
| `ga.traffic_drop` | (current.sessions - prior.sessions) / prior.sessions <= -0.15 |
| `ga.traffic_spike` | sessionDelta >= 0.20 |
| `ga.high_bounce` | current.bounceRate >= 0.6 |
| `ga.ad_waste` | (current.channels.paid / total) > 0.3 AND current.bounceRate >= 0.55 |
| `ga.seo_opportunity` | (current.channels.organic / total) < 0.20 |
| `ga.shallow_engagement` | current.avgSessionDurationSec < 30 |

`total = sum of all channel values`.

Write `/task/output.json`:

```json
{ "insights": [{ "id": "ga.traffic_drop", "severity": "critical", "title": "...", "message": "...", "action": "..." }] }
```
