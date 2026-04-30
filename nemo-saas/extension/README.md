# Nemo Growth Coach (Chrome extension)

Reborn from `DGTL-MKTG-ASST-main`. This version is a **thin client** to the
Nemo SaaS backend; no Google OAuth lives in the extension and no data is
analyzed locally.

## Why we rewired

| Old (DGTL-MKTG-ASST + MKTG-Chrome-Extenstion) | New (Nemo Growth Coach) |
|---|---|
| OAuth direct to Google in the extension | OAuth lives once in Nemo SaaS; extension carries a backend session token |
| Insight rules baked into `background.js` | Insights generated server-side by `lib/skills/_shared/rule-engine.ts`; same rules drive PDFs, dashboard, and extension |
| No telemetry, no usage limits | Backend tracks usage, gates by plan, observability built in |
| Two competing extensions | One extension; `MKTG-Chrome-Extenstion` archived |
| Updating prompts ships an extension review | Update server prompts, no review |

## Pairing flow

1. User clicks the extension icon → "Pair this extension" → opens
   `https://app.nemo.local/extension/pair` in a new tab.
2. The page authenticates the user (Supabase auth) and mints a long-lived
   extension token (rotated 90d, scoped to the org).
3. The page calls `chrome.runtime.sendMessage({ type: 'nemo_pair', token })`
   on the extension id, which the background worker receives and stores in
   `chrome.storage.sync`.
4. Future popup opens hit `GET /api/extension/insights?product=ga4|gsc|gbp`
   with `Authorization: Bearer <token>`. Backend resolves org, runs the
   appropriate skill (cached per-window), returns `Insight[]`.

## Build

No build step. Load unpacked from this folder during dev. For release:

```bash
zip -r nemo-growth-coach.zip extension/ -x '*.DS_Store'
```

## Archive note

Once this extension ships and installs verify, archive
[`sentientsprite/MKTG-Chrome-Extenstion`](https://github.com/sentientsprite/MKTG-Chrome-Extenstion)
with a README pointer to this folder.
