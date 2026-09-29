# Agent map — desks → repos

Vault-grounded, short. Org-chart desks (not a to-do list). Coding agents: read with root [`CLAUDE.md`](../CLAUDE.md).

Sources: build-assistant `workflows/grokbot-build-spike.md`, org-mission-control task playbooks, TASK-0016 fit report.

## Desks

| Desk | Lane | Primary repos / paths | Do not |
|------|------|------------------------|--------|
| **BUILD** (GROKBOT coworker) | Code, monorepo, harness, SaaS skills | `~/autoagent`, `~/Projects/build-assistant`; MC tasks via `~/Projects/org-mission-control` | Trading, creator publish, Owner chat as SoR |
| **DANIEL** | Route / desk dispatch / mail orchestration | `~/Projects/daniel-assistant`, `desk_dispatch` | Implement BUILD tickets itself |
| **Nemo** | Product / marketing wedge (SaaS) | `~/autoagent/nemo-saas`, `~/Projects/nemo-assistant` | Treat as trading desk |
| **BRAD** | Trading / capability loops | `~/Projects/brad-assistant` | Replace with Grok Bot |
| **STANLY** | Creator / publish | `~/Projects/stanly-assistant` | Replace with Grok Bot |
| **OPTIMUS / MC** | Org tasks, outbox, playbooks | `~/Projects/org-mission-control` | Install gated MCP from here |

## Dispatch (BUILD)

```
meta.runner hermes|grokbot
  → daniel-assistant desk_dispatch
  → grokbot pending + build-assistant/data/desk_inbox/*.json
```

Pull: `daniel-assistant` `scripts/grokbot_desk_pull.py`. Mark done via `desk_dispatch.mark_done('grokbot', '<id>', 'done')`.

## autoagent internals (coding)

| Concern | Where |
|---------|--------|
| Skills | `nemo-saas/lib/skills/` |
| Connectors | `nemo-saas/lib/connectors/` |
| SkillEval | `tasks/` |
| Harness | `agent.py`, `program.md` |
| Keywords (parked) | `nemo-saas/fixtures/keywords/` |

## Explicit gates

- **GitNexus MCP:** hold (TASK-0016). Reopen only when BUILD Cursor lane is intentional **and** local `gitnexus analyze` succeeds under MCP timeout.
- Mini bots: keep `CURSOR_SDK_ENABLED=0` unless Owner flips.

_Last updated: 2026-09-23 · GROKBOT ticket 7dc6350a_
