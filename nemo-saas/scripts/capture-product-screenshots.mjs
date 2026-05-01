/**
 * Customer-facing UI captures for decks / storefront / docs.
 *
 * Usage:
 *   1. Start the app: npm run dev   (default http://127.0.0.1:3000)
 *   2. npm run screenshots:products
 *
 * Production (deploy **this** app to your customer Vercel project, e.g. nemo-app-v-1):
 *   BASE_URL=https://nemo-app-v-1.vercel.app npm run screenshots:products
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outDir = join(root, "product-screenshots");

const baseUrl = (process.env.BASE_URL || "http://127.0.0.1:3000").replace(/\/+$/, "");

/** @type {{ name: string; path: string; viewport: { width: number; height: number }; fullPage?: boolean }[]} */
const shots = [
  {
    name: "01-wedge-landing-desktop",
    path: "/",
    viewport: { width: 1440, height: 900 },
    fullPage: true,
  },
  {
    name: "02-wedge-landing-mobile",
    path: "/",
    viewport: { width: 390, height: 844 },
    fullPage: true,
  },
  {
    name: "03-wedge-post-submit-desktop",
    path: "/?demo=post-submit",
    viewport: { width: 1440, height: 900 },
    fullPage: true,
  },
  {
    name: "04-wedge-post-submit-mobile",
    path: "/?demo=post-submit",
    viewport: { width: 390, height: 844 },
    fullPage: true,
  },
  {
    name: "05-product-beacon-desktop",
    path: "/products/beacon",
    viewport: { width: 1440, height: 900 },
    fullPage: true,
  },
  {
    name: "06-product-echo-desktop",
    path: "/products/echo",
    viewport: { width: 1440, height: 900 },
    fullPage: true,
  },
  {
    name: "07-product-bloom-desktop",
    path: "/products/bloom",
    viewport: { width: 1440, height: 900 },
    fullPage: true,
  },
];

async function main() {
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  for (const shot of shots) {
    const context = await browser.newContext({ viewport: shot.viewport });
    const page = await context.newPage();
    const url = `${baseUrl}${shot.path}`;
    try {
      const res = await page.goto(url, { waitUntil: "load", timeout: 90_000 });
      if (!res || !res.ok()) {
        console.warn(`Warning: ${url} returned ${res?.status() ?? "no response"}`);
      }
      await new Promise((r) => setTimeout(r, 400));
      const file = join(outDir, `${shot.name}.png`);
      await page.screenshot({ path: file, fullPage: Boolean(shot.fullPage) });
      console.log("Wrote", file);
    } catch (err) {
      console.error(`Failed ${url}:`, err instanceof Error ? err.message : err);
      console.error("Is the dev server running? Try: npm run dev");
      process.exitCode = 1;
    } finally {
      await context.close();
    }
  }

  await browser.close();
}

main();
