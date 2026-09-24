#!/usr/bin/env node
/**
 * Money Farm HQ locations smoke (no Stripe / Places / network).
 *
 * Loads fixtures/money-farm/org-two-locations.json, computes locationCap inline
 * (mirrors lib/billing/money-farm LOCATION_CAPS), prints count / cap / names.
 *
 * Mirror of money-farm-p0-dry-run.mjs style — zero deps.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const fixturePath = path.join(root, "fixtures/money-farm/org-two-locations.json");

/** Inline copy of LOCATION_CAPS — keep in sync with lib/billing/money-farm.ts */
const LOCATION_CAPS = {
  free: 1,
  local_autopilot: 5,
  growth_operator: 25,
  agency: 100,
};

function locationCap(plan) {
  return LOCATION_CAPS[plan] ?? 1;
}

const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
if (!fixture.org || !Array.isArray(fixture.sites) || fixture.sites.length < 2) {
  console.error("FAIL: fixture must include org + ≥2 sites");
  process.exit(1);
}

const plan = fixture.org.plan ?? "free";
const cap = locationCap(plan);
const locationCount = fixture.sites.length;
const atCap = locationCount >= cap;
const names = fixture.sites.map((s) => s.name || s.business_name || s.id);

const out = {
  ok: true,
  source: "fixture",
  orgId: fixture.org.id,
  orgName: fixture.org.name,
  plan,
  locationCap: cap,
  locationCount,
  atCap,
  locationNames: names,
  note:
    "HQ smoke — fixture plan as-is with locationCap. free+2 sites → atCap. No Stripe/Places/network.",
};

console.log(JSON.stringify(out, null, 2));
process.exit(0);
