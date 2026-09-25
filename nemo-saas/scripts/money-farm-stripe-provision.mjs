#!/usr/bin/env node
/**
 * Money Farm — provision Founding Product + $199/mo Price via Stripe API.
 *
 * Autonomy: agents SETUP Founding Checkout without Owner clicking Dashboard.
 * Idempotent: reuses matching product name + recurring $199 USD price.
 *
 * Usage (from nemo-saas):
 *   node scripts/money-farm-stripe-provision.mjs
 *
 * Reads STRIPE_SECRET_KEY from env or .env.local.
 * Writes STRIPE_PRICE_FOUNDING into .env.local ONLY if missing.
 * Never prints full secret or full price id — prefix + last 4 only.
 *
 * Exit codes:
 *   0  ok (provisioned or reused)
 *   2  missing STRIPE_SECRET_KEY (soft fail — no stack of secrets)
 *   1  Stripe / IO error (message only; no key dump)
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ENV_LOCAL = path.join(ROOT, ".env.local");

const PRODUCT_NAME = "Nemo Local — Founding";
const AMOUNT_CENTS = 19_900;
const CURRENCY = "usd";
const INTERVAL = "month";

function loadEnvLocal() {
  if (!existsSync(ENV_LOCAL)) return {};
  const out = {};
  for (const line of readFileSync(ENV_LOCAL, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

function maskPriceId(id) {
  if (!id || id.length < 8) return "price_****";
  return `price_****${id.slice(-4)}`;
}

function upsertEnvLocalKey(key, value) {
  const existing = existsSync(ENV_LOCAL) ? readFileSync(ENV_LOCAL, "utf8") : "";
  const lines = existing.length ? existing.split(/\r?\n/) : [];
  const re = new RegExp(`^\\s*${key}=`);
  let found = false;
  const next = lines.map((line) => {
    if (re.test(line)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });
  if (!found) {
    if (next.length && next[next.length - 1] !== "") next.push("");
    next.push(`# Money Farm Founding — written by money-farm-stripe-provision.mjs`);
    next.push(`${key}=${value}`);
    next.push("");
  }
  writeFileSync(ENV_LOCAL, next.join("\n"), { mode: 0o600 });
}

async function main() {
  const fileEnv = loadEnvLocal();
  const secret = (process.env.STRIPE_SECRET_KEY || fileEnv.STRIPE_SECRET_KEY || "").trim();

  if (!secret) {
    console.log("missing key: STRIPE_SECRET_KEY unset in env and .env.local");
    console.log("Owner: drop sk_test_... (then later sk_live_/rk_) into .env.local once — never paste into chat.");
    console.log("Mock Checkout remains green without a key.");
    process.exit(2);
  }

  const modeHint = secret.startsWith("sk_live") || secret.startsWith("rk_live")
    ? "LIVE"
    : secret.startsWith("sk_test") || secret.startsWith("rk_test")
      ? "TEST"
      : "UNKNOWN";
  console.log(`STRIPE_SECRET_KEY: SET (${modeHint} prefix detected — value not printed)`);

  let Stripe;
  try {
    const require = createRequire(path.join(ROOT, "package.json"));
    Stripe = require("stripe");
  } catch (e) {
    console.error("fail: stripe package not loadable — run npm install in nemo-saas");
    process.exit(1);
  }

  const stripe = new Stripe(secret);

  // Idempotent product lookup by exact name
  let product = null;
  for await (const p of stripe.products.list({ limit: 100, active: true })) {
    if (p.name === PRODUCT_NAME) {
      product = p;
      break;
    }
  }
  if (!product) {
    product = await stripe.products.create({
      name: PRODUCT_NAME,
      description: "Founding — $199/mo ≤5 locations → plan local_autopilot (Money Farm)",
      metadata: {
        nemo_offer: "founding",
        location_cap: "5",
        maps_to_plan: "local_autopilot",
      },
    });
    console.log("product: created");
  } else {
    console.log("product: reused");
  }

  // Idempotent price: same product + recurring $199 USD/mo
  let price = null;
  for await (const pr of stripe.prices.list({ product: product.id, limit: 100, active: true })) {
    if (
      pr.currency === CURRENCY &&
      pr.unit_amount === AMOUNT_CENTS &&
      pr.recurring?.interval === INTERVAL &&
      pr.type === "recurring"
    ) {
      price = pr;
      break;
    }
  }
  if (!price) {
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: AMOUNT_CENTS,
      currency: CURRENCY,
      recurring: { interval: INTERVAL },
      metadata: {
        nemo_offer: "founding",
        location_cap: "5",
        maps_to_plan: "local_autopilot",
      },
    });
    console.log("price: created");
  } else {
    console.log("price: reused");
  }

  const existingPrice = (process.env.STRIPE_PRICE_FOUNDING || fileEnv.STRIPE_PRICE_FOUNDING || "").trim();
  let wrote = false;
  if (!existingPrice) {
    upsertEnvLocalKey("STRIPE_PRICE_FOUNDING", price.id);
    wrote = true;
  } else if (existingPrice !== price.id) {
    console.log(
      `note: STRIPE_PRICE_FOUNDING already set (${maskPriceId(existingPrice)}); left unchanged (provisioned ${maskPriceId(price.id)})`,
    );
  }

  console.log(`ok product=${PRODUCT_NAME}`);
  console.log(`ok price=${maskPriceId(price.id)}`);
  console.log(
    wrote
      ? "ok wrote STRIPE_PRICE_FOUNDING into .env.local (missing → set)"
      : "ok STRIPE_PRICE_FOUNDING already present — not overwritten",
  );
  process.exit(0);
}

main().catch((err) => {
  const msg = err && typeof err === "object" && "message" in err ? String(err.message) : String(err);
  // Never echo request headers / raw key material
  console.error(`fail: ${msg.slice(0, 200)}`);
  process.exit(1);
});
