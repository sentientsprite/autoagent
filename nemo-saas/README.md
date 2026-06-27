# Nemo SaaS — Phase 4 productization scaffold

> **Status: dormant.** This is the **Phase 4** productization track for
> [Prana Marketing Solutions](https://github.com/sentientsprite/NEMO-APP-v.1).
> It activates **only after** Prana hits the M-SEP-30 milestone
> ($4,500+ verified MRR, 3+ clients, 2+ add-ons live). Until then the
> active business is the agency model in
> [BUSINESS_PLAN.md](https://github.com/sentientsprite/NEMO-APP-v.1/blob/main/BUSINESS_PLAN.md).
>
> Don't run customers through this scaffold yet. Don't merge its
> multi-tenancy patterns into the live `openclaw` runtime. Treat it as
> a future-product on-ice that you can warm up in days when the gate
> opens.

The scaffold implements a slim, multi-tenant SMB marketing SaaS — wedge
(free Local Visibility Score) → recurring scheduled-skills product. When
Phase 4 activates, this is the codebase that productizes Beacon, Echo,
and Bloom for buyers outside Raymond's hand-delivered agency clients.

## Customer-facing UI screenshots

To regenerate PNGs for decks or listings (wedge, demo scorecard, Beacon/Echo/Bloom pages):

```bash
npm install && npx playwright install chromium
npm run dev   # in one terminal
npm run screenshots:products   # in another; outputs under product-screenshots/
```

Customer-facing routes live under **`app/(marketing)/`**: **`/`**, **`/portal`** (buyer tools), **`/team`** (employee bookmarks, `noindex`), **`/products/*`**, demo scorecard query on `/`. Access matrix: **[`docs/ACCESS_AND_PORTALS.md`](docs/ACCESS_AND_PORTALS.md)**.

Use `BASE_URL=https://…` to capture a deployed **`nemo-app-v-1`** build instead of localhost (that project must deploy **this** Next app — see trunk [`README.md`](https://github.com/sentientsprite/NEMO-APP-v.1/blob/main/README.md) § customer vs internal). Details in [`product-screenshots/README.md`](product-screenshots/README.md).

## When Phase 4 activates, start here

- **Run it locally in 30 minutes** → [`QUICKSTART.md`](QUICKSTART.md)
- **Test what you built** → [`TESTING.md`](TESTING.md)
- **Customer experience after signup** → [`../docs/onboarding-customer.md`](../docs/onboarding-customer.md)

## Strategy and decisions

- [`../docs/icp-and-wedge.md`](../docs/icp-and-wedge.md) — committed ICP and wedge
- [`../docs/pricing.md`](../docs/pricing.md) — tiers and packaging
- [`../docs/distribution.md`](../docs/distribution.md) — go-to-market motion
- [`../docs/oauth-verification.md`](../docs/oauth-verification.md) — Google OAuth verification track
- [`../tasks/`](../tasks/) — Harbor SkillEval task packs (regression scorecard for every skill)

## Architecture

```
nemo-saas/
├── app/                       # Next.js App Router (web + API)
│   ├── (marketing)/           # `/`, `/portal`, `/team`, `/products/*`
│   ├── (app)/                 # Authenticated dashboard
│   └── api/                   # API routes (oauth, inngest, stripe webhook, lvs)
├── lib/
│   ├── skills/                # The "agents" — one folder per skill
│   │   ├── _shared/           # Rule engine + per-tenant playbook (borrowed)
│   │   ├── local_visibility_audit/
│   │   ├── gsc_opportunity_finder/
│   │   └── ga4_health_brief/
│   ├── connectors/            # Google API clients (GSC, GA4, GBP, Places)
│   ├── workflows/             # Inngest functions (the "supervisor")
│   ├── db/                    # Supabase types + helpers
│   ├── auth/                  # Session + RLS helpers
│   ├── billing/               # Stripe wiring
│   ├── email/                 # Resend + react-email templates
│   ├── pdf/                   # @react-pdf/renderer report
│   ├── crawler/               # Wraps Playwright worker (borrowed from Nemo)
│   └── kms/                   # Per-tenant envelope encryption
├── extension/                 # Chrome extension (rewired thin client)
├── docs/CLIENT_INTELLIGENCE.md # Per-site CLIENT.md + weekly brief contract
└── supabase/migrations/       # SQL schema (orgs, sites, connectors, jobs, artifacts)
```

## Quick start (when implementing)

```bash
# 1. Install
pnpm install

# 2. Local Supabase
supabase start
supabase db reset   # applies migrations

# 3. Run dev stack (in three terminals)
pnpm dev                  # Next.js
pnpm inngest:dev          # Inngest dev server
docker run -p 8080:8080 nemo/crawler   # Playwright worker

# 4. Visit
open http://localhost:3000   # wedge landing
```

## Skill model

Each skill is a folder under [`lib/skills/`](lib/skills/) and exports:

- `Input` and `Output` Zod schemas
- `runDeterministic(input)` — pure data work, no LLM
- `runNarrative(deterministicOutput, playbook)` — LLM call, structured output
- `run(input)` — convenience wrapper that does both
- A README documenting tool allowlist, scopes required, and verifier hooks

Skills are pure libraries. The **workflow engine** (Inngest, [`lib/workflows/`](lib/workflows/)) is the supervisor: it sequences skills, persists artifacts, and emits events.

## Client intelligence

Every paid `Site` gets a canonical **`CLIENT.md`** stored in
`client_intelligence_files`. Agents must read it before touching the account
and append `client_intelligence_events` after meaningful actions. The Monday
`weekly_client_brief` is a two-paragraph plain-English account note, not a chart
report. Full contract:
[`docs/CLIENT_INTELLIGENCE.md`](docs/CLIENT_INTELLIGENCE.md).

## Why this is not a fork of Nemo/OpenClaw

See [`../README.md`](../README.md) (Harbor harness) and the v2 plan. OpenClaw is a personal-assistant gateway; this SaaS is a multi-tenant scheduled-skills product. We borrow the rule engine, the playbook markdown pattern, and the Playwright wiring — not the gateway.
