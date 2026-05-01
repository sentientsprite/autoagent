# Product screenshots

PNG captures of **customer-facing** UI from [`app/(marketing)/`](../app/(marketing)/).

Generate (requires dev server **or** set `BASE_URL` to your deployed `nemo-app-v-1` site):

```bash
cd nemo-saas
npm install
npx playwright install chromium   # once per machine
npm run dev                       # terminal A — or skip if using BASE_URL below
npm run screenshots:products      # terminal B
```

Production:

```bash
BASE_URL=https://your-customer-domain.vercel.app npm run screenshots:products
```

Files are overwritten each run; commit the versions you want for pitch decks or storefronts.
