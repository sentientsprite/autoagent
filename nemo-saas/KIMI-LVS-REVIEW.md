# KIMI-LVS-REVIEW — /api/lvs 500 lead_persist_failed

## Verified root cause

Production `POST /api/lvs` returned `{"error":"lead_persist_failed","detail":"TypeError: fetch failed"}`.
That detail string is produced **only** by @supabase/postgrest-js's network wrapper
(`postgrest-js/dist/index.cjs`): a rejected `fetch()` becomes
`error.message = "TypeError: fetch failed"` on a response with **HTTP status 0**.

Therefore the request died at the **network layer before any HTTP response** — DNS/TCP/TLS to the
Supabase host. Ruled out by the same evidence:

- **Missing env / malformed URL / anon-key-as-service-key** → `dbAsService()` throws → route's
  503 `supabase_misconfigured` branch (not seen in production).
- **Missing `leads` table** → HTTP 404, code `PGRST205`, "Could not find the table … schema cache".
- **Bad service key** → HTTP 401 "Invalid API key".

Most likely concrete cause: the host configured in Vercel `NEXT_PUBLIC_SUPABASE_URL` does not
resolve (deleted/renamed/typo'd Supabase project ref). The route's old hint (and QUICKSTART.md's
"Hosted Supabase" section) pointed at migrations/keys — the wrong layer, which misdirected triage.

## Files changed (code-side only)

- `lib/db/errors.ts` **(new)** — `classifySupabaseError()` → `unreachable_host | missing_table |
  invalid_key | unknown`, with cause-code extraction (ENOTFOUND, …) and layer-correct hints.
- `lib/db/client.ts` — new exported `parseSupabaseUrl()`; `dbAsService()`/`dbAsUser()` fail fast
  with errors that name the exact env var and defect (unset / missing scheme / unparseable / empty
  host). Still throws at first use, not import, so CI builds without env keep working.
- `app/api/lvs/route.ts` — lead and job insert failures now pass `{ ...err, status: res.status }`
  through the classifier; responses gain a `category` field, hints name the real layer, and
  unreachable-host returns **502** (other persist failures stay 500). Server logs now include
  postgrest `details` (carries the network cause code; contains no secrets).
- `lib/db/errors.test.ts` **(new)**, `lib/db/client.test.ts` **(new)** — taxonomy + env-validation
  coverage, including a regression test pinning the exact production signature.

## Verification

Applied after the diagnosing session (writes were permission-denied there). Run locally:
`npm run typecheck`, `npx vitest run`.

## Remaining operator steps (no secrets here)

1. In the Vercel project **nemo-app-v-1** env, read the **hostname** of `NEXT_PUBLIC_SUPABASE_URL`
   (do not copy keys) and `dig +short <host>` it. If it does not resolve, the project ref is wrong
   or the project was deleted.
2. In the Supabase dashboard, confirm the intended project exists and is **not paused**; copy its
   ref from Project Settings → General and compare with step 1.
3. Update Vercel `NEXT_PUBLIC_SUPABASE_URL` (and `SUPABASE_SERVICE_ROLE_KEY` only if the project
   changed — service_role JWT, not anon) and redeploy.
4. Re-probe: `curl -X POST https://nemo-app-v-1.vercel.app/api/lvs …` — expect 200, or a 500 whose
   `category` now names the layer (`missing_table` → run migrations per QUICKSTART.md).
5. Consider updating QUICKSTART.md §"Hosted Supabase" to mention the `unreachable_host` category.
