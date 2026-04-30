# `_shared` — borrowed parts (no fork required)

This module packages everything we **borrow** from the existing
[sentientsprite](https://github.com/sentientsprite) repos so the SaaS doesn't
have to fork the gateway. Each file documents its provenance.

| File | Borrowed from | What it does |
|---|---|---|
| [`rule-engine.ts`](rule-engine.ts) | `DGTL-MKTG-ASST-main/background.js` `analyzeDataWithAI()` | Deterministic GA4 / GBP / NAP rules. Server-side, tenant-aware, stable rule ids for Harbor verifiers. |
| [`playbook.ts`](playbook.ts) | nemo-workspace markdown pattern (`AGENTS.md`, `MEMORY.md`, `SOUL.md`) | Renders a per-tenant Markdown playbook used as system prompt for narrative LLM calls. |
| [`llm.ts`](llm.ts) | new (Vercel AI SDK) | One choke point for narrative model calls so prompts/usage stay observable. |
| [`../../crawler/client.ts`](../../crawler/client.ts) | Nemo `src/browser/` Playwright wiring | Snapshots a URL via the worker; falls back to `fetch + cheerio` for tests. |

## Rules-as-data

Every recommendation surfaced anywhere in the product (PDFs, emails, dashboard,
Chrome extension) starts as an `Insight` with a stable `id`. That id is what
Harbor task verifiers assert on. If `gbp.low_review_velocity` stops firing on
the fixture site, the eval suite fails and the release is blocked.

This is the wedge against "ChatGPT for SEO" tools — they have no regression
suite and silently degrade with model upgrades.
