# Testing — wedge, skills, workflows, SkillEval

> Manual + automated test plan. Sequenced from "smoke" (5 min, run after
> any change) to "full" (run before a release).

Assumes you've completed [`QUICKSTART.md`](QUICKSTART.md). All tests below
work without paid API keys; the LLM and Places lookups are optional.

---

## Test pyramid (what runs when)

```
                  [Manual UAT]            <- before release, ~30 min
                /                \
        [Harbor SkillEval]        <- nightly + pre-release, ~10 min
        /                  \
[Workflow integration]   [Skill unit tests]   <- on every PR, < 2 min
       /                          \
[Schema + RLS smoke]      [Lint + typecheck]  <- on every push, < 30 s
```

---

## Tier 1 — fast (every push)

### Lint + typecheck

```bash
cd nemo-saas
pnpm lint
pnpm typecheck
```

These are wired to the Next.js / TypeScript defaults via
[`tsconfig.json`](tsconfig.json) and `next lint`.

### Schema smoke (Postgres + RLS sanity)

After `supabase db reset`:

```bash
psql postgresql://postgres:postgres@localhost:54322/postgres -c "
  select schemaname, tablename from pg_tables where schemaname = 'public' order by tablename;
"
```

Expected: `artifacts`, `client_intelligence_events`,
`client_intelligence_files`, `connectors`, `jobs`, `leads`, `org_members`,
`orgs`, `schedules`, `sites`, `weekly_client_briefs` (11 tables).

```bash
psql postgresql://postgres:postgres@localhost:54322/postgres -c "
  select tablename, rowsecurity from pg_tables
  where schemaname = 'public' and rowsecurity = true order by tablename;
"
```

Expected: all 8 tables with RLS enabled.

---

## Tier 2 — skill unit tests

> Not yet wired into the repo (vitest is in `devDependencies` but no
> `*.test.ts` files yet). This section documents the contract every skill
> test must satisfy. Add tests as you ship features.

For each skill in [`lib/skills/`](lib/skills/), the unit test file lives
alongside `index.ts` (e.g. `lib/skills/local_visibility_audit/index.test.ts`).
It must:

1. Verify `Input.parse(...)` rejects malformed input with `ZodError`.
2. Run `runDeterministic()` against an inline fixture and assert specific
   `insights[].id` values fire (or do not fire).
3. Snapshot the deterministic output structure (not values that drift
   like timestamps).
4. Mock the LLM call (don't burn credits in CI). The narrative test asserts
   the schema-conformance contract from `narrative()`, not prose content.

Example test skeleton (write at `lib/skills/local_visibility_audit/index.test.ts`):

```ts
import { describe, it, expect } from "vitest";
import { runDeterministic } from "./index";

describe("local_visibility_audit deterministic", () => {
  it("fires gbp.profile_incomplete when phone is missing", async () => {
    // Note: requires mocking findPlace + fetchNapRecords.
    // For now, see the Harbor SkillEval cases for the same coverage
    // exercised end-to-end via the agent harness.
  });
});
```

Until those land, **the Harbor SkillEval is the primary skill regression
test**. See Tier 4 below.

---

## Tier 3 — workflow + API integration

### Wedge (sync end-to-end)

```bash
curl -sS -X POST http://localhost:3000/api/lvs \
  -H 'content-type: application/json' \
  -d '{
    "email": "test+'$(date +%s)'@example.com",
    "businessName": "Hudson Plumbing Co.",
    "zip": "80301"
  }' | jq
```

Pass criteria:

- Response status 200, JSON has `ok: true`, `grade`, `score`, `reportUrl`.
- `reportUrl` returns a PDF (Content-Type `application/pdf`).
- Supabase `leads` table contains a new row with the email.
- Supabase `jobs` table contains a `status='succeeded'` row, `kind='local_visibility_audit'`,
  `result` JSON includes `insights[]`.
- Supabase `artifacts` table contains a `kind='pdf'` row pointing at the storage path.

**Follow-up loop** (optional env — see `.env.example`):

- With `LVS_INTERNAL_NOTIFY_EMAIL` + `RESEND_API_KEY`: internal alert email arrives.
- With `OUTBOUND_CRM_WEBHOOK_URL` + `HUNTER_WEBHOOK_SECRET`: outbound CRM gets a row
  with `source=lvs_wedge`, `external_id=lvs:{leadId}`, email in notes.
- With `INNGEST_EVENT_KEY`: Inngest receives `nemo/lead.wedge.followup` (nurture runs after
  `LVS_NURTURE_DELAY_HOURS`, default 48).

Failure paths to test:

```bash
# Bad email
curl -sS -X POST http://localhost:3000/api/lvs -H 'content-type: application/json' \
  -d '{"email":"not-an-email","businessName":"Acme","zip":"80301"}' | jq
# Expect: { "error": "invalid_input", ... }, status 400

# Bad zip
curl -sS -X POST http://localhost:3000/api/lvs -H 'content-type: application/json' \
  -d '{"email":"a@b.com","businessName":"Acme","zip":"badzip"}' | jq
# Expect: { "error": "invalid_input", ... }, status 400
```

### Inngest workflow — monthly site report

Trigger from the Inngest UI (`http://localhost:8288`):

```json
{
  "name": "nemo/site.report.monthly",
  "data": {
    "siteId": "00000000-0000-0000-0000-000000000010",
    "orgId": "00000000-0000-0000-0000-000000000001"
  }
}
```

Pass criteria:

- Function transitions through steps: `load-site` → `load-connectors` →
  `local_visibility_audit` (always runs).
- With seed data, `gsc_opportunity_finder` and `ga4_health_brief` steps
  are skipped (no connectors).
- Final return contains `lvs: <grade>`.
- A new row appears in `jobs` for the LVS step.

### Inngest workflow — single job by id

Manually insert a job row in Supabase Studio:

```sql
insert into jobs (org_id, site_id, kind, status, input)
values (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000010',
  'local_visibility_audit',
  'queued',
  '{}'::jsonb
)
returning id;
```

Then in Inngest UI emit:

```json
{
  "name": "nemo/job.requested",
  "data": {
    "jobId": "<id from insert>",
    "orgId": "00000000-0000-0000-0000-000000000001",
    "siteId": "00000000-0000-0000-0000-000000000010",
    "kind": "local_visibility_audit"
  }
}
```

Pass criteria: job row transitions `queued → running → succeeded`,
`duration_ms` populated, `result` contains the deterministic output.

### Plan gating (server-side enforcement)

```bash
# Unit-test-style: import { planAllows } from "@/lib/billing/stripe";
# Confirm:
# planAllows("free", "local_visibility_audit") === true
# planAllows("free", "gsc_opportunity_finder") === false
# planAllows("growth_operator", "competitor_pulse") === false
# planAllows("agency", "competitor_pulse") === true
```

When the dashboard ships, every "create schedule" or "run on-demand" path
must call `guardJobForOrg(orgId, kind)` from
[`lib/billing/gating.ts`](lib/billing/gating.ts) before enqueueing.

### Envelope encryption round-trip

```ts
import { encryptToken, decryptToken } from "@/lib/kms/envelope";

const orgA = "11111111-1111-1111-1111-111111111111";
const orgB = "22222222-2222-2222-2222-222222222222";

const enc = encryptToken("refresh_xyz_secret", orgA);
console.assert(decryptToken(enc, orgA) === "refresh_xyz_secret");

try {
  decryptToken(enc, orgB);
  throw new Error("should have thrown");
} catch (e) {
  // Expected: AAD mismatch, GCM auth tag rejects
}
```

Confirms tokens cannot be silently moved between tenants.

---

## Tier 4 — Harbor SkillEval (the release gate)

Lives in [`../tasks/`](../tasks/README.md). Run from the autoagent root:

```bash
cd ..  # /Users/symbiote_home/autoagent

# One-time setup
docker build -f Dockerfile.base -t autoagent-base .

# Run all SkillEval cases (parallel)
rm -rf jobs && mkdir -p jobs && \
  uv run harbor run -p tasks/ \
    -n 4 \
    --agent-import-path agent:AutoAgent \
    -o jobs --job-name skilleval-$(date +%Y%m%d)

# Score roll-up
uv run harbor view jobs/
# → http://localhost:8000
```

Per-skill release gates (also in [`tasks/README.md`](../tasks/README.md)):

| Skill | Mean ≥ | Min ≥ | If failed |
|---|---|---|---|
| `local_visibility_audit` | 0.85 | 0.70 | Block release; investigate which case regressed |
| `gsc_opportunity_finder` | 0.85 | 0.70 | Same |
| `ga4_health_brief` | 0.85 | 0.70 | Same |

Adding a new case (use this pattern; reference existing cases under
[`tasks/local_visibility_audit/case_01_*`](../tasks/local_visibility_audit/case_01_missing_phone_and_low_reviews/)):

```text
tasks/<skill>/case_<n>_<short_name>/
  task.toml                   # name, skill, expected_rule_ids
  instruction.md              # tells the agent what to do
  files/input.json            # fixture
  files/expected.json         # gold standard
  tests/test.sh               # one-liner that runs test.py
  tests/test.py               # imports _shared.verify, writes /logs/reward.txt
  environment/Dockerfile      # FROM autoagent-base
```

The shared verifier helpers live at
[`tasks/_shared/verify.py`](../tasks/_shared/verify.py):

- `score_insights(fired_ids, expected_ids)` — coverage + precision blend
- `score_gsc_opportunities(output, expected)` — page-level coverage + order
- `write_reward(score)` — writes `0.0–1.0` to `/logs/reward.txt`

---

## Tier 5 — manual UAT (before each release)

20-minute checklist. Run against staging once it exists; against local for now.

### Wedge

- [ ] Open landing in Chrome incognito; submit form with valid inputs
- [ ] Receive emailed PDF (if `RESEND_API_KEY` configured)
- [ ] Open the same PDF link from the response — renders correctly on phone width
- [ ] PDF letter grade is consistent with `score` (A ≥ 90, B ≥ 80, C ≥ 65, D ≥ 50, else F)
- [ ] PDF "Top fixes" section references actual `insights[].id` values from the deterministic output
- [ ] Submit the same email twice — both leads persist (we don't dedupe at the wedge)

### Workflow

- [ ] Manually trigger `nemo/site.report.monthly` from Inngest UI; finishes < 60s
- [ ] Per-step timings visible in Inngest function detail
- [ ] Failed step (e.g. delete the test site mid-run) marks the job `failed` and stores `error_message`

### Chrome extension

- [ ] Loads unpacked without console errors
- [ ] Popup shows "Pair this extension" before pairing
- [ ] Chip appears in the corner of `analytics.google.com`, `search.google.com/search-console`, `business.google.com`
- [ ] Options page disconnect clears the stored token

### Plan gating

- [ ] As a `free` org, requesting a `gsc_opportunity_finder` schedule via API returns 403
- [ ] After updating `orgs.plan` to `growth_operator`, the same request succeeds
- [ ] After deleting the Stripe subscription (webhook fires `customer.subscription.deleted`), org drops back to `free`

---

## Test data

Seeded by [`supabase/seed.sql`](supabase/seed.sql):

| Table | Row | Use |
|---|---|---|
| `orgs` | `Acme Landscaping` (`00000000-0000-0000-0000-000000000001`) | Default test org |
| `sites` | `Acme Landscaping — main` (`00000000-0000-0000-0000-000000000010`) | Default test site, Boulder CO |
| `leads` | `demo@example.com` | Demo lead row |

Harbor fixtures (no DB required): see
[`tasks/*/case_*/files/input.json`](../tasks/) — 7 cases across 3 skills.

---

## CI integration (proposed)

When you wire CI (GitHub Actions on this repo), suggested job graph:

```yaml
jobs:
  lint-typecheck:    pnpm lint && pnpm typecheck
  unit:              pnpm test --run            # once vitest cases land
  workflow-smoke:    pnpm dev & curl /api/lvs   # hits the wedge with a mock Places key
  skilleval:         uv run harbor run -p tasks/ -n 4 ...
                     # parse jobs/.../results.tsv, fail if any per-skill mean < 0.85
```

Run `lint-typecheck` and `unit` on every push. Run `workflow-smoke` on PRs.
Run `skilleval` nightly + on release branches.
