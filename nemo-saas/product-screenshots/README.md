# Product screenshots

PNG captures from [`app/(marketing)/`](../app/(marketing)/).

| File | Route |
|------|--------|
| `01-wedge-landing-desktop` · `02-wedge-landing-mobile` | `/` |
| `03-wedge-post-submit-desktop` · `04-wedge-post-submit-mobile` | `/?demo=post-submit` (no API call; for marketing captures) |
| `05-product-beacon-desktop` | `/products/beacon` |
| `06-product-echo-desktop` | `/products/echo` |
| `07-product-bloom-desktop` | `/products/bloom` |

Generate (dev server **or** production URL):

```bash
cd nemo-saas
npm install
npx playwright install chromium   # once per machine
npm run dev                       # terminal A — omit if using BASE_URL only
npm run screenshots:products      # terminal B
```

Production — **`nemo-app-v-1` must deploy this `nemo-saas` app** (not `outbound-crm`). Use a **clean** shell line (some terminals inject bracketed-paste characters that break the npm script name):

```bash
export BASE_URL=https://nemo-app-v-1.vercel.app
npm run screenshots:products
```

Or a single line with **no** trailing `~` or hidden characters:

```bash
BASE_URL=https://nemo-app-v-1.vercel.app npm run screenshots:products
```

If you run `npm run screenshots:products` **without** `BASE_URL`, it uses `http://127.0.0.1:3000` — start `npm run dev` first, or set `BASE_URL` as above.

**`vercel dev`:** run from the **Git repo root** `autoagent/`, not from `nemo-saas/`, so the project root directory (`nemo-saas`) is not doubled. Example: `cd /path/to/autoagent && vercel env pull .env.local && vercel dev`.

If `BASE_URL` still shows the **Outbound CRM login**, fix Vercel: point **`nemo-app-v-1`** at repo **`autoagent`**, root **`nemo-saas`**, then redeploy.

Files are overwritten each run; commit the versions you want for decks or storefronts.
