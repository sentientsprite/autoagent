# Task: local_visibility_audit — case_01

You are running the `local_visibility_audit` skill on a fixture business.

## What to do

1. Read the structured input at `/task/files/input.json`. It contains:
   - `business`: name, zip, website
   - `gbp_profile`: a `GbpProfile` object (see schema below)
   - `nap_records`: list of NAP records found in directories
2. Apply the Nemo rule engine semantics (see "Rules" below) to identify
   which `Insight` ids should fire.
3. Write the result to `/task/output.json` in this exact shape:

```json
{
  "insights": [
    { "id": "gbp.profile_incomplete", "severity": "critical", "title": "...", "message": "...", "action": "..." }
  ]
}
```

The verifier scores you on (a) which expected ids fired and (b) precision
(no unexpected ids).

## GbpProfile schema

```
hasName, hasAddress, hasPhone, hasWebsite, hasHours, hasPrimaryCategory: bool
photoCount: int
serviceAreaZipCount, expectedServiceAreaZipCount: int
reviewCount: int
avgRating: float (0..5)
reviewsLast90d: int
```

## Rules (subset relevant to this case)

| Rule id | Fires when |
|---|---|
| `gbp.profile_incomplete` | any of {hasPhone, hasWebsite, hasHours, hasPrimaryCategory} is false |
| `gbp.thin_photos` | photoCount < 10 |
| `gbp.service_area_gaps` | serviceAreaZipCount < expectedServiceAreaZipCount |
| `gbp.low_review_velocity` | reviewsLast90d < 3 |
| `gbp.rating_under_4_2` | avgRating < 4.2 AND reviewCount >= 10 |

## Notes

- Do NOT invent rule ids. The verifier rejects unknown ids.
- Severity values: `critical | warning | info | win`.
- Title/message/action are scored loosely (length > 0); the rule ids are the hard signal.
