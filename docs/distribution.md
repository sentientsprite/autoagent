# Distribution motion

> Implements todo `distribution-motion`. Concrete partnership and channel
> targets, not slogans. Reviewed quarterly.

## Principle

SMB SaaS dies in CAC. The wedge (free LVS audit) is built so that **someone
else's audience** can run it on their members for free and we capture the
email. We don't build a paid-ads engine until we've maxed partnership-led
acquisition.

---

## Lead motion: Home services (Local Autopilot)

### 1. Trade associations and franchise networks

Reach out with a co-branded "Local Visibility Score" tool offer. They get a
member benefit; we get warm leads.

| Org | Member count | Pitch |
|---|---|---|
| **PHCC** (Plumbing-Heating-Cooling Contractors Association) | ~3k member businesses | Free LVS for members; co-branded report |
| **NALP** (National Association of Landscape Professionals) | ~1k member businesses | Same |
| **NACE** (electricians, residential focus) | ~30k members | Same |
| **PWNA** (Power Washers of North America) | ~1.5k | Same |
| **Local home-builder associations** (NAHB chapters) | per metro | Local sales motion via chapter ED |
| **State plumbing/electrical boards** | per state | Educational webinar pitch |

Outreach sequence:

1. Email the executive director with a 90-second Loom of the wedge.
2. Offer a member-only landing URL: `nemo.local/score?via=phcc`.
3. Co-branded monthly digest: "5 worst Local Visibility Scores we saw this
   month, anonymized" — sent to their members.

### 2. Service-software integrations (the highest-ROI integrations)

These products own the customer relationship for home services. Listed with
the integration shape we'd build:

| Product | Integration | Lift |
|---|---|---|
| **Jobber** | Marketplace app: "Nemo Local — auto-request reviews after job complete" | 10k+ active companies |
| **Housecall Pro** | Same shape; also expose LVS card in their dashboard | 30k+ companies |
| **ServiceTitan** | Enterprise tier integration; longer cycle; needs SOC2 | Larger contracts ($499+) |
| **FieldEdge** | Smaller; faster to ship | Niche but loyal |
| **WorkWave** | Lawn-care vertical | NALP overlap |

Each integration ships:

- One-click connect to a Site (auto-fills business profile from their CRM)
- Webhook on "job completed" → triggers `reputation_loop` SMS template
- Read-only export of completed jobs for the LVS service-area heatmap

### 3. Local-agency white-label (sneaky channel)

Local marketing agencies serving home-services clients **already** have the
trust relationship. We sell them the Agency tier (phase 3) at a steep
discount and they resell at retail. They get analyst leverage; we get
distribution and sticky multi-location accounts.

### 4. Content seeding

Two-pillar content strategy, posted on a slow but consistent schedule:

- **"Local Visibility Score of the Week"**: anonymized teardown of one
  business profile, scored, with the 3 fixes we'd recommend. SEO-driven
  long-tail capture for `[city] [trade] SEO`.
- **"Why your Google Business Profile leaks leads"**: short-form video
  series, owner-first language, posted to YouTube + LinkedIn + the trade
  association forums above.

KPI: not blog traffic. Track "homepage visitors who ran the wedge" weekly.

---

## Lead motion: Growing online (Growth Operator)

### 1. Chrome extension as viral surface

Every screenshot of the extension in the wild is an ad. The chip in the
GA/GSC tab carries the brand. The extension is **free** to install
(authenticated against a free workspace) — paid plans unlock scheduled
reports and the third-party drafts.

### 2. Tool-comparison content

These keywords have predictable buyer intent. We rank for them:

- "Ahrefs alternative for small business"
- "Semrush vs [X] for under 5k impressions"
- "GA4 weekly report tool"
- "ChatGPT for SEO that doesn't hallucinate" (this is the actual pitch)

Each comparison post links to the wedge plus a Growth Operator demo video.

### 3. Solo-founder + indie-hacker presence

Not the ICP, but high-leverage word-of-mouth. Ship a public scorecard of
SkillEval results ("This week's GSC opportunity finder accuracy: 0.91")
to demonstrate the quality regression suite. No competitor does this.

---

## Distribution accountability

Track weekly:

- Wedge completions / week (top of funnel)
- Wedge-to-paid conversion rate (truth metric)
- Partnership-attributed wedges / week (per partner)
- Agency-resold seats (after phase 3)

Rule: no paid ads spend until the partnership funnel is producing >50
wedges/week and converting at >2%. Paid ads are a multiplier on a working
funnel, not a substitute for one.
