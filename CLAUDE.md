# CLAUDE.md — autoagent (Nemo monorepo)

Light map for coding agents (Cursor / Claude / GROKBOT·BUILD). Not a product README — see `README.md` for AutoAgent / SkillEval narrative.

## What this repo is

| Area | Path | Role |
|------|------|------|
| **Nemo SaaS** | `nemo-saas/` | Multi-tenant B2B wedge (Next.js): skills, connectors, LVS, workflows |
| **SkillEval** | `tasks/` | Harbor regression packs for skills — release gate (mean ≥ 0.85 / min ≥ 0.70) |
| **Harness** | `agent.py`, `program.md` | AutoAgent hill-climb harness (meta-agent edits above FIXED ADAPTER BOUNDARY) |
| **Spryte** | `spryte/` | Related runtime/scaffold (see its README) |
| **Docs (product)** | `docs/` | ICP, pricing, onboarding, oauth — business, not code map |
| **Jobs** | `jobs/` | Harbor run outputs (local; often gitignored / regenerated) |

Prana trunk strategy lives in NEMO-APP-v.1; this repo is a component (see `.prana/component.yaml`).

## Skills (`nemo-saas/lib/skills/`)

| Skill | Notes |
|-------|--------|
| `local_visibility_audit` | LVS wedge — Places + rule-engine + narrative |
| `local_landing_builder` | Landing drafts from local signals |
| `gsc_opportunity_finder` | GSC opportunity cases (Harbor-covered) |
| `ga4_health_brief` | GA4 health brief (Harbor-covered) |
| `competitor_pulse` | Competitor pulse |
| `paid_qa` | Paid QA |
| `reputation_loop` | Reputation loop |
| `_shared/` | Rule engine, playbook, LLM helpers, stubs |

Harbor packs under `tasks/` today: `local_visibility_audit`, `gsc_opportunity_finder`, `ga4_health_brief`.

## Connectors & related libs

- `nemo-saas/lib/connectors/` — e.g. Places (`places.ts`, tests)
- `nemo-saas/lib/keywords/` — keyword helpers (Phase 2 keywords: **parked**; BG two-sheet fixture only)
- `nemo-saas/fixtures/keywords/` — `page-keyword-strategy.template.json` / `.export.json` (canonical shape; no multi-brand / no `brandCode`)
- Workflows / Inngest / Supabase under `nemo-saas/lib/workflows`, `nemo-saas/supabase`, etc.

## How to run tests

### Fast (every change in `nemo-saas/`)

```bash
cd ~/autoagent/nemo-saas
npm run lint
npm run typecheck
npm test          # vitest run
```

### SkillEval (Harbor — slower; nightly / pre-release)

```bash
cd ~/autoagent
# single case example
rm -rf jobs && mkdir -p jobs && uv run harbor run \
  -p tasks/local_visibility_audit/case_01_missing_phone_and_low_reviews/ \
  -n 1 --agent agent:AutoAgent -o jobs --job-name lvs_01

# all packs under tasks/
rm -rf jobs && mkdir -p jobs && uv run harbor run -p tasks/ \
  -n 1 --agent agent:AutoAgent -o jobs --job-name skilleval-nightly
```

Details: `tasks/README.md`, `nemo-saas/TESTING.md`, `nemo-saas/QUICKSTART.md`.

### Harness / agent.py

Read `program.md` + `README.md` before editing `agent.py`. Baseline first; only edit above the FIXED ADAPTER BOUNDARY unless Owner says otherwise.

## Hard don'ts

1. **Do not install GitNexus MCP** (or any new MCP) unless Owner reopens after TASK-0016 gates. Static map = this file + `docs/agent-map.md`.
2. **No `.env` secrets in chat** — never paste keys; use local `.env` / `.env.example` only.
3. **No commit/push** unless Owner says `commit`.
4. **LVS keywords:** do not revive multi-brand CRM / `brandCode` / Serper Map Pack (Phase 2b) unless Owner asks. BG two-sheet template only.
5. **Lane:** coding in this monorepo (± `~/Projects/build-assistant`). Not DANIEL routing, not BRAD trading, not STANLY creator, not Nemo marketing copy.
6. **`agent.py`:** do not change model away from `gpt-5` (see `program.md`) unless human changes that constraint; do not edit below FIXED ADAPTER BOUNDARY without explicit ask.
7. Prefer **small diffs**; match existing conventions in each subtree.

## Desk / org map

Short desks → repos: [`docs/agent-map.md`](docs/agent-map.md).

## Owner / BUILD notes

- GROKBOT tickets land via `daniel-assistant` desk_dispatch → `build-assistant/data/desk_inbox/`.
- Keywords Phase 2 workflow note (parked): `~/Projects/build-assistant/workflows/nemo-lvs-phase2-keywords.md`.
