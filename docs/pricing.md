# Pricing and packaging

> Implements todo `packaging-and-billing`. Locked tiers, what's gated, and
> how the control plane enforces them.

## Tiers

| Tier | Price | ICP | Included skills (scheduled) | On-demand |
|---|---|---|---|---|
| **Free / Wedge** | $0 | Anyone running the LVS audit | none scheduled | `local_visibility_audit` (one shot, emailed PDF) |
| **Nemo Local — Local Autopilot** | $99/mo (solo) · $199/mo (multi-tech) | Home services SMB | `local_visibility_audit` weekly · `reputation_loop` weekly · `local_landing_builder` monthly · `ga4_health_brief` monthly | All of the above + `local_visibility_audit` ad-hoc |
| **Nemo Growth — Growth Operator** | $299/mo (single site) · $599/mo (3 sites) · $799/mo (5 sites) | Growing online business (e-com, SaaS, info-product, local chains) | `gsc_opportunity_finder` weekly · `ga4_health_brief` monthly · `paid_qa` weekly · `local_landing_builder` monthly · everything in Local | Includes Chrome extension |
| **Nemo Agency** (phase 3) | $499/mo per analyst seat OR $1,999/mo for 25 client locations | Local agencies / fractional CMOs | All skills incl. `competitor_pulse` | White-label PDFs, multi-client workspace, REST API |

Add-ons (any tier above Free):

- Extra site: +$49/mo (Local), +$199/mo (Growth)
- Same-day priority audit: +$29/audit
- Phone support and onboarding call: +$199 one-time

## Plan gating (server-side)

Plan gating is enforced in [`nemo-saas/lib/billing/stripe.ts`](../nemo-saas/lib/billing/stripe.ts) via `PLAN_JOBS`:

```ts
free            -> [local_visibility_audit]
local_autopilot -> + ga4_health_brief, reputation_loop, local_landing_builder
growth_operator -> + gsc_opportunity_finder, paid_qa
agency          -> + competitor_pulse
```

`planAllows(plan, kind)` is called before any schedule create or on-demand job
enqueue. The control plane never trusts the client to pick a job kind it
isn't paying for.

## Stripe wiring

- One Stripe Product per tier; metered add-ons via separate prices.
- `STRIPE_PRICE_LOCAL_AUTOPILOT` (and siblings) live in env vars.
- Webhook lives at [`/api/stripe/webhook`](../nemo-saas/app/api/stripe/webhook/route.ts) and
  updates `orgs.plan`, `orgs.stripe_customer_id`, `orgs.stripe_subscription_id`.
- Customer portal link from `/app/billing` opens Stripe-hosted portal — we do
  not build a custom card-management UI.

## Why these prices

- **$99 floor** for home services because the LVS wedge tells them they're
  losing leads — paying $99 to fix that is a no-brainer math story
  ("one extra job per quarter pays for the year").
- **$299 floor** for Growth because the comparable agency retainer is
  $3–8k/mo. Growth Operator is positioned as "a junior SEO analyst that
  never sleeps" at <10% of the cost.
- **Agency** is intentionally underpriced vs HubSpot / Semrush Agency to
  make the 25-location plan a no-brainer for boutique shops.

## Annual discount

- 2 months free on annual: pricing rendered as `Local: $999/yr (save $189)`.
- Lock-in story: "we keep your weekly reports forever in your dashboard".

## Migration of legacy users

Anyone who used the wedge for a free LVS audit gets a 30-day discount code
(`WEDGE30`) for the first month of Local Autopilot. Stripe coupon, scoped to
the Local tier only.
