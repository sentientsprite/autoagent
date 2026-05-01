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

Production — **`nemo-app-v-1` must deploy this `nemo-saas` app** (not `outbound-crm`). Then:

```bash
BASE_URL=https://nemo-app-v-1.vercel.app npm run screenshots:products
```

If `BASE_URL` still shows the **Outbound CRM login**, fix Vercel: point **`nemo-app-v-1`** at repo **`autoagent`**, root **`nemo-saas`**, then redeploy.

Files are overwritten each run; commit the versions you want for decks or storefronts.
