# Customer vs employee access (plan)

This doc tracks **who uses what** after splitting customer marketing (`nemo-saas` on **`nemo-app-v-1`**) from internal tools (**Outbound CRM**, **`nemo-workspace`**, OpenClaw Hunter).

## Hub routes (this repo)

| Route | Audience | Purpose |
|-------|----------|---------|
| **`/`** | Customers | Local Visibility Score wedge |
| **`/products/*`** | Customers | Beacon / Echo / Bloom SKU copy |
| **`/portal`** | Customers | GrowthCoach Chrome extension, DGTL-MKTG-ASST, SKU entry points |
| **`/team`** | Employees | CRM, Hunter docs/console, analytics/trading/strategist bookmarks (`robots: noindex`) |

## Matrix (repos → role)

| Surface | Employees | Customers | Repo / deploy |
|---------|-----------|-----------|----------------|
| Outbound CRM | ✓ sales / closer | ✗ | `NEMO-APP-v.1` → `apps/outbound-crm` → **`outbound-crm`** Vercel |
| Hunter (lead machine) | ✓ | ✗ | OpenClaw Mini + `hunter-daily` / fixture workflows → CRM webhook |
| Analytics / pipeline dashboard | ✓ | ✗ (tenant dash Phase 4) | **`sentientsprite/nemo-workspace`** — URL TBD (`NEXT_PUBLIC_PRANA_DASHBOARD_URL`) |
| Trading bot | ✓ | ✗ | `nemo-workspace/trading/` |
| DGTL strategist bot | ✓ ops | ✗ | Orchestrated from **`nemo-workspace`** / agents — UI TBD |
| GrowthCoach Chrome | ✗ | ✓ free | **`sentientsprite/MKTG-Chrome-Extenstion`** — Store URL TBD |
| DGTL Marketing Assistant | ✗ | ✓ product | **`spryte-engine/DGTL-MKTG-ASST-main`** — app URL TBD |

## Environment variables (customer site / Vercel)

Optional deep links from **`/portal`** and **`/team`**:

| Variable | Used on |
|----------|---------|
| `NEXT_PUBLIC_GROWTHCOACH_STORE_URL` | `/portal` Chrome Web Store |
| `NEXT_PUBLIC_DGTL_MKTG_ASSIST_URL` | `/portal` DGTL app |
| `NEXT_PUBLIC_PRANA_OUTBOUND_CRM_URL` | `/team` CRM base URL |
| `NEXT_PUBLIC_PRANA_DASHBOARD_URL` | `/team` analytics |
| `NEXT_PUBLIC_TRADING_DASHBOARD_URL` | `/team` trading |
| `NEXT_PUBLIC_HUNTER_CONSOLE_URL` | `/team` Hunter UI when it exists |

## Plan changes vs earlier assumption

1. **Explicit hubs** — Previously marketing was only wedge + SKU pages. We added **`/portal`** (buyers) and **`/team`** (staff bookmarks, noindex).
2. **No unified SSO yet** — Each backend keeps its own auth; hubs are navigation only.
3. **Strategist + trading** — Both roll under **`nemo-workspace`** in planning until separate UIs ship.
4. **Customer “product portals”** — Beacon/Echo/Bloom full logged-in portals remain **Phase 4 placeholders**; today customers get SKU pages + wedge + external DGTL/Chrome links.

## Missing / next

- [ ] Publish GrowthCoach to Chrome Web Store → set `NEXT_PUBLIC_GROWTHCOACH_STORE_URL`
- [ ] Host DGTL-MKTG-ASST web → set `NEXT_PUBLIC_DGTL_MKTG_ASSIST_URL`
- [ ] Hosted Prana dashboard URL → `NEXT_PUBLIC_PRANA_DASHBOARD_URL`
- [ ] Optional: password-gate **`/team`** or move to internal-only deployment
- [ ] Tenant analytics inside customer Phase 4 app (`(app)/`)
