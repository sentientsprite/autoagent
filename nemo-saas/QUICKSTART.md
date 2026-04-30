# Quickstart — local development

> Get the wedge + scheduled jobs + Chrome extension + SkillEval running on
> your laptop in ~30 minutes.

## What you'll have at the end

1. The wedge landing page at `http://localhost:3000` running the
   `local_visibility_audit` skill end-to-end (deterministic + LLM narrative
   + emailed PDF).
2. Inngest dev UI at `http://localhost:8288` showing the `monthlySiteReport`
   workflow chaining audit → GSC → GA4 → reporter.
3. The Chrome extension loaded unpacked, paired against your local backend.
4. Harbor SkillEval running 7 task cases against the agent harness with
   numeric per-skill scores written to `jobs/`.

---

## Prerequisites

| Tool | Version | Why |
|---|---|---|
| Node.js | ≥ 22 | Next.js 15, Inngest |
| pnpm | ≥ 9 | Workspace package manager |
| Docker Desktop | recent | Harbor task containers + (optional) crawler worker |
| [Supabase CLI](https://supabase.com/docs/guides/cli) | ≥ 2.0 | Local Postgres + auth + storage |
| [uv](https://docs.astral.sh/uv/) | ≥ 0.5 | Harbor harness runtime (already in this repo's [README.md](../README.md)) |
| [Inngest CLI](https://www.inngest.com/docs/dev-server) | latest | `npx inngest-cli@latest dev` |

API keys you can defer:

- `OPENAI_API_KEY` — needed for narrative LLM step. The skill returns the
  deterministic part without it; narrative just becomes `undefined`.
- `GOOGLE_MAPS_API_KEY` — needed for live Places lookups. Without it, the
  wedge marks `placeFound: false` and fires `gbp.not_found` (still useful
  for testing the rule engine + email flow).
- `GOOGLE_OAUTH_*` — only needed when testing `gsc_opportunity_finder` or
  `ga4_health_brief` against real Google data. Both skills accept fixture
  inputs for tests.
- `RESEND_API_KEY` — without it, the wedge succeeds but skips the email
  (URL is still returned).
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — only needed for the
  paid-plan flow.

---

## 1. Install dependencies

```bash
cd nemo-saas
pnpm install
```

This pulls Next.js, Supabase clients, Inngest, googleapis, Stripe SDK,
react-pdf, react-email, Vercel AI SDK, Cheerio, etc. (See
[`package.json`](package.json) for the full list.)

---

## 2. Set up environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in at minimum:

```bash
# Supabase — populated automatically when you run `supabase start`
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<from `supabase status` output>
SUPABASE_SERVICE_ROLE_KEY=<from `supabase status` output>

# Required: 32-byte base64 KMS key for envelope-encrypted OAuth tokens.
# Generate with: openssl rand -base64 32
NEMO_TENANT_KMS_KEY=<paste>

# Optional but recommended for the LLM narrative step
OPENAI_API_KEY=sk-...
NEMO_NARRATIVE_MODEL=gpt-4o-mini

# Optional: Google Places for real GBP lookups in the wedge
GOOGLE_MAPS_API_KEY=AIza...

# Optional: emails. If unset, the wedge skips sending and returns the URL only.
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL="Nemo Local <reports@nemo.local>"
```

Generate the KMS key now:

```bash
openssl rand -base64 32
```

Paste the result as `NEMO_TENANT_KMS_KEY`. **Rotate annually in
production**; never commit the value.

---

## 3. Start Supabase locally

```bash
# From nemo-saas/
supabase start
```

This boots Postgres on `54322`, Studio on `54323`, the API on `54321`, and
the storage emulator. First run downloads images (~2 min). The console
prints the local anon key and service role key — copy them into
`.env.local`.

Apply the schema:

```bash
supabase db reset
```

That runs [`supabase/migrations/20260429000000_init.sql`](supabase/migrations/20260429000000_init.sql)
plus [`supabase/seed.sql`](supabase/seed.sql) (which creates the
`Acme Landscaping` demo org + site).

Open Supabase Studio at `http://localhost:54323` to confirm tables are
present (orgs, sites, connectors, jobs, artifacts, schedules, leads).

Create the storage buckets the wedge writes to (config.toml will define
them on `supabase start`, but if you need to retry):

```bash
# Public reports bucket (wedge PDFs, signed-URL-free)
supabase storage create public-reports --public

# Private artifacts bucket (paid-tier reports)
supabase storage create artifacts
```

---

## 4. Start the dev stack (3 terminals)

### Terminal 1 — Next.js

```bash
pnpm dev
# → http://localhost:3000
```

### Terminal 2 — Inngest dev server

```bash
npx inngest-cli@latest dev -u http://localhost:3000/api/inngest
# → http://localhost:8288 (Inngest UI)
```

It auto-discovers the functions registered in
[`nemo-saas/lib/workflows/index.ts`](lib/workflows/index.ts) via the
[`/api/inngest`](app/api/inngest/route.ts) handler.

### Terminal 3 — Crawler worker (optional, only if you want real directory snapshots)

For now this is unimplemented; the [`lib/crawler/client.ts`](lib/crawler/client.ts)
falls back to a plain `fetch` + Cheerio snapshot when `NEMO_CRAWLER_URL`
is empty. Skip this terminal until we ship a Playwright worker container.

---

## 5. Smoke test the wedge

In a fourth terminal:

```bash
curl -sS -X POST http://localhost:3000/api/lvs \
  -H 'content-type: application/json' \
  -d '{
    "email": "you@example.com",
    "businessName": "Greenline Landscaping",
    "zip": "80302",
    "websiteUrl": "https://greenline.example"
  }' | jq
```

Expected response (within ~10 seconds):

```json
{
  "ok": true,
  "grade": "B",
  "score": 78,
  "reportUrl": "http://localhost:54321/storage/v1/object/public/public-reports/wedge/<lead-id>.pdf"
}
```

Open `reportUrl` in your browser to view the PDF. If `OPENAI_API_KEY` is
set, the PDF includes the narrative section ("Top fixes"); otherwise just
the structured insights.

In Supabase Studio, confirm:

- One row in `leads` with your email
- One row in `jobs` with `status='succeeded'`, `kind='local_visibility_audit'`
- One row in `artifacts` pointing at the PDF

---

## 6. Browse the landing page

Open `http://localhost:3000` and submit the form. Same path as the curl,
just with the React UI on top.

---

## 7. Trigger the monthly workflow (chained skills)

In the Inngest UI (`http://localhost:8288`), click **Send Event** and emit:

```json
{
  "name": "nemo/site.report.monthly",
  "data": {
    "siteId": "00000000-0000-0000-0000-000000000010",
    "orgId": "00000000-0000-0000-0000-000000000001"
  }
}
```

The site id is from [`supabase/seed.sql`](supabase/seed.sql). Watch the
function run: it loads site + connectors, runs the LVS skill (always),
runs GSC if a connector exists (it doesn't yet), runs GA4 if a connector
exists. With seed data only the LVS step runs and returns a grade.

---

## 8. Load the Chrome extension

```bash
# Build is no-op; it's a static folder.
open -a "Google Chrome"
```

In Chrome:

1. Visit `chrome://extensions`
2. Toggle **Developer mode**
3. Click **Load unpacked** → select `nemo-saas/extension/`
4. Pin the extension; click the icon

You'll see "Pair this extension" because there's no token yet. Pairing UI
(`/extension/pair`) is not built yet — it's a phase 2 milestone in the
plan. The extension and backend pieces are wired and the message-passing
flow is documented in [`extension/README.md`](extension/README.md); the
actual `/extension/pair` page is a few hours of work for the next pass.

---

## 9. Run the Harbor SkillEval suite

The SkillEval lives one directory up, in the autoagent workspace root.

```bash
cd ..   # back to /Users/symbiote_home/autoagent

# Build the harbor base image (one-time)
docker build -f Dockerfile.base -t autoagent-base .

# Run a single case
rm -rf jobs && mkdir -p jobs && \
  uv run harbor run \
    -p tasks/local_visibility_audit/case_01_missing_phone_and_low_reviews/ \
    -l 1 -n 1 \
    --agent-import-path agent:AutoAgent \
    -o jobs --job-name lvs_01

# Run the full SkillEval suite
rm -rf jobs && mkdir -p jobs && \
  uv run harbor run -p tasks/ \
    -n 4 \
    --agent-import-path agent:AutoAgent \
    -o jobs --job-name skilleval-nightly
```

See per-case scores under `jobs/skilleval-nightly/` and a roll-up via the
viewer:

```bash
uv run harbor view jobs/
# → http://localhost:8000
```

Suggested release gate (also documented in
[`tasks/README.md`](../tasks/README.md)):

- Per-skill mean score ≥ 0.85
- Per-skill min score ≥ 0.70

---

## Common issues

| Symptom | Likely cause | Fix |
|---|---|---|
| `Supabase env vars missing` on first request | `.env.local` not loaded | Restart `pnpm dev` after editing the file |
| Wedge returns `placeFound: false` for every input | `GOOGLE_MAPS_API_KEY` missing | Either add the key or accept fixture-grade output |
| LVS PDF has no "Top fixes" section | `OPENAI_API_KEY` missing | Add the key; narrative becomes `undefined` without it |
| Inngest dev UI shows "0 functions" | Wrong `-u` URL | Must point at `http://localhost:3000/api/inngest` exactly |
| `supabase db reset` fails on storage | Buckets already exist | Rerun `supabase start`, or manually `supabase storage create` |
| `pnpm install` is slow on first run | Playwright + react-pdf are heavy | Wait it out; subsequent installs are fast |
| Harbor `uv run` complains about Python 3.12 | Run from the autoagent root, not `nemo-saas/` | `cd ..` |

---

## What's safe to skip on day 1

- The crawler worker (fallback works for the wedge)
- Stripe wiring (run free tier only until tiers ship)
- Google OAuth (all three skills accept fixture inputs)
- Production envelope key rotation (reuse the same `NEMO_TENANT_KMS_KEY`
  in dev forever)
- Email sending (without `RESEND_API_KEY` the wedge still returns the URL)

---

## Next docs

- [`TESTING.md`](TESTING.md) — manual + automated test plan
- [`../docs/onboarding-customer.md`](../docs/onboarding-customer.md) — what end users see after signup
- [`../docs/oauth-verification.md`](../docs/oauth-verification.md) — Google OAuth submission strategy (calendar-time critical)
- [`../tasks/README.md`](../tasks/README.md) — Harbor SkillEval format and release gates
