# SPRYTE (monorepo scaffold)

Local-marketing SaaS scaffold: shared LLM layer, draft-first agent core, Harbor-style audit agent, and a Next.js lead-magnet page at `/audit`.

## Layout

See `pnpm-workspace.yaml`. This checkout lives under the `autoagent` workspace at `autoagent/spryte/` so it can be edited in-place; move it to a standalone git root (`spryte/`) anytime.

## Prereqs

- Node.js 20+
- `pnpm`
- Postgres URL in `.env` when you wire Prisma (optional for `/audit` v1)

## Env

Copy `.env.example` to `apps/web/.env.local` (Next loads env from the app directory) **and/or** export variables in your shell. Minimum for a real audit:

- `ANTHROPIC_API_KEY` — primary scorer (Haiku-class model name via `SPRITE_ANTHROPIC_MODEL`)
- `MLX_BASE_URL` / `MLX_MODEL` — local OpenAI-compat fallback (`http://127.0.0.1:8000/v1` by default)
- `PINCHTAB_BASE_URL` — browser automation endpoint (defaults to `http://127.0.0.1:9867`; set `PINCHTAB_CRAWL_PATH` if your route is not `/crawl`)

Tune total server time with `AUDIT_BUDGET_MS` (defaults to `28000`).

## Scripts

From `spryte/`:

```bash
pnpm install
pnpm dev
```

`dev` rebuilds `@spryte/llm`, `@spryte/core`, and `@spryte/auditor`, then starts Next.js.

## Note on Apple Neural Engine (ANE)

The `maderix/ANE` project is independent research/training tooling for Apple silicon — not a production orchestration substrate. Coordinating installed CLIs/models should stay userland (MLX, sandboxed subprocesses, policies), not undocumented ANE-private APIs.

## Product direction (from roadmap)

Implement packages/db migrations, dashboards, and remaining agents (reporter → content → reputation → ads). Every external mutation should pass the `pending_approval` gate in `@spryte/core`.
