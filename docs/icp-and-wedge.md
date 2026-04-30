# ICP and wedge — committed decision

> Implements todo `pick-icp-and-wedge` from the v2 plan.

## Decision

**Lead ICP: Home services SMBs.** Specifically: landscapers, handymen, HVAC, plumbers, residential cleaners, pest control, electricians, roofers, painters. US first. Solo operators and 2–10 person crews.

**Wedge: free Local Visibility Score (LVS).** Public landing page, no login. Inputs: business name + zip (and optional website URL). Output: graded report (A–F) covering:

- Google Business Profile (GBP) completeness
- NAP (name/address/phone) consistency across N directories
- Review velocity vs local competitors (last 90 days)
- Service-area coverage gaps
- Top 3 prioritized fixes with one-click "send to my email" PDF

LVS runs the [`local_visibility_audit`](../nemo-saas/lib/skills/local_visibility_audit/README.md) skill synchronously, captures the email, and ends with a soft pitch for the paid SKU.

**Why this ICP first**

| Criterion | Home services | Growing online businesses |
|---|---|---|
| Wedge converts to paid | High — solo owners feel "I'm leaving leads on the table" instantly | Medium — agency relationships compete |
| Competition density | Lower — most SEO SaaS targets agencies and ecom | Saturated (Ahrefs, Semrush, Surfer, etc.) |
| Sales motion clarity | Trade associations + service-software integrations | Content + SEO arbitrage (slower) |
| ACV vs effort | $99–$199/mo, low support burden | $299–$799/mo, more support |
| Moat from quality harness | Very visible — bad recommendations cost real leads | Visible but slower feedback loop |

Growing online is **phase 2** product line, not the wedge.

## Brand

Keep `Nemo` as the parent brand (B2B-neutral, available, links to existing repo lineage). Product name for the home-services SKU: **Nemo Local**. Wedge URL pattern: `nemo.local/score/{slug}` placeholder.

## What "done" looks like for this decision

- [x] ICP locked
- [x] Wedge concept locked
- [x] Brand and SKU naming locked
- [ ] Wedge landing page shipping `local_visibility_audit` synchronously (covered by later todos)
- [ ] OAuth verification kickoff timing (covered by `oauth-verification-track`)

## Non-goals for v1

- No paid ads connectors at launch (phase 2)
- No agency multi-client mode (phase 3)
- No messaging-channel UX (phase 6, optional)
- No competitor pulse skill (phase 3)
