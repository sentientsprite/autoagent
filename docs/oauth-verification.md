# Google OAuth verification track

> Implements todo `oauth-verification-track`. Calendar-time-critical.
> Start the day the wedge ships, not the day you need it.

## Why this is on the critical path

Three of the paid skills (`gsc_opportunity_finder`, `ga4_health_brief`,
plus the future `paid_qa` and full GBP-managed audit) require OAuth scopes
that Google classifies as **Sensitive** or **Restricted**. Production use
without verification is silently rate-limited or blocked once you cross
~100 lifetime users. The verification process takes **4–8 weeks** from
clean submission. Plan accordingly.

References:

- [OAuth API verification FAQ](https://support.google.com/cloud/answer/9110914)
- [Restricted scopes](https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification)
- [Brand verification](https://support.google.com/cloud/answer/10311615)

## Scopes we will request (with justification)

| Scope | Skill | Why minimum-necessary |
|---|---|---|
| `https://www.googleapis.com/auth/webmasters.readonly` | `gsc_opportunity_finder` | Read-only access to query/page performance for the user's verified properties. We never need write. |
| `https://www.googleapis.com/auth/analytics.readonly` | `ga4_health_brief` | Read-only metrics. Restricted scope — needs full verification. |
| `https://www.googleapis.com/auth/business.manage` | future `gbp_managed_audit` | We do write GBP posts on behalf of the user (Local Autopilot tier). |
| `https://www.googleapis.com/auth/adwords` | future `paid_qa` | Read-only Search Term Reports + read of campaigns. |

Out of scope at launch (avoid until proven necessary): Drive, Gmail, Calendar.

## Phased submission strategy

We do NOT submit all four scopes at once.

1. **Submission 1 (week 0, day 0 of wedge launch):** GSC `webmasters.readonly`
   only. This is "Sensitive" not "Restricted" — much faster verification.
   Unblocks `gsc_opportunity_finder`.
2. **Submission 2 (week 1):** GA4 `analytics.readonly`. Restricted; longer
   review.
3. **Submission 3 (week 4, after first paying customers):** GBP `business.manage`.
4. **Submission 4 (when launching `paid_qa`):** Ads `adwords`.

Each submission adds the scope to the **same** OAuth client; we do not run
multiple clients.

## Submission checklist

For every scope:

- [ ] OAuth consent screen filled in completely (logo, support email, privacy
      policy URL, terms URL, app domain). All HTTPS.
- [ ] Privacy policy explicitly mentions the scope and the data it returns.
      Generic privacy policies fail.
- [ ] Demo video (≤2 min): show consent screen, the exact data we read, where
      it appears in our product, how the user can disconnect.
- [ ] Justification document: 1 page per scope, "what data, what purpose, why
      this scope is the minimum needed."
- [ ] Domain verified in Google Search Console under the same account.
- [ ] App domain matches the OAuth client redirect URIs.
- [ ] If Restricted: complete the security assessment questionnaire honestly.
      Material misstatements get the app pulled later.

## Brand verification (parallel track)

Brand verification removes the "unverified app" warning at the consent step.
It's separate from scope verification and takes 1–3 weeks.

- [ ] Verify domain ownership in Google Cloud Console.
- [ ] Submit logo (120×120 PNG, transparent bg).
- [ ] Public homepage at the verified domain that explains the product.

## Pre-verification life

Until verified, the OAuth client is in **Testing** mode and we can add up to
100 test users by email. The wedge does NOT require OAuth (deliberate); paid
features start with hand-added test users while verification proceeds.

## When the security assessment is needed

Restricted-scope use at production scale (>100 users) requires a CASA tier 2
assessment from a Google-approved third party. Budget:

- **Cost:** $5k–$15k.
- **Time:** 4–6 weeks once started.
- **When to start:** the day the wedge converts its 50th customer to a paid
  plan that uses GA4 (i.e. Growth Operator). Do not wait for the 99th user
  warning.

## Failure modes to avoid

- Submitting with a placeholder privacy policy ("we may collect data") —
  instant rejection.
- Asking for a broader scope than needed (`https://www.googleapis.com/auth/analytics`
  instead of `analytics.readonly`) — reviewers reject and require resubmit.
- Showing the consent screen in the demo video without showing what we DO
  with the data afterward — reviewers reject.
- Forgetting to update the consent screen before submitting changes —
  reviewers re-test with current settings.

## Owner

Single owner for the verification track (not split). Weekly status update
in the team channel until all four submissions are approved.
