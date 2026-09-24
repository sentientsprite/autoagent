#!/usr/bin/env node
/**
 * Money Farm HQ locations smoke (no Stripe / Places / network).
 *
 * Modes:
 * 1) raw fixture (free plan as-is → atCap with 2 sites)
 * 2) founding demo (planOverride local_autopilot → cap 5 → not atCap)
 *
 * Inline LOCATION_CAPS mirrors lib/billing/money-farm.ts — zero deps.
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

function mapFixture(fixture, planOverride) {
  const plan = planOverride ?? fixture.org.plan ?? "free";
  const cap = locationCap(plan);
  const locationCount = fixture.sites.length;
  const atCap = locationCount >= cap;
  const names = fixture.sites.map((s) => s.name || s.business_name || s.id);
  return {
    ok: true,
    source: "fixture",
    orgId: fixture.org.id,
    orgName: fixture.org.name,
    plan,
    planOverride: planOverride ?? null,
    rawFixturePlan: fixture.org.plan,
    locationCap: cap,
    locationCount,
    atCap,
    locationNames: names,
  };
}

const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
if (!fixture.org || !Array.isArray(fixture.sites) || fixture.sites.length < 2) {
  console.error("FAIL: fixture must include org + ≥2 sites");
  process.exit(1);
}

const raw = mapFixture(fixture);
raw.mode = "raw_fixture";
raw.note =
  "HQ smoke mode 1 — fixture plan as-is with locationCap. free+2 sites → atCap. No Stripe/Places/network.";

const founding = mapFixture(fixture, "local_autopilot");
founding.mode = "founding_demo";
founding.note =
  "HQ smoke mode 2 — planOverride=local_autopilot (founding). cap 5 → not atCap with 2 sites. Raw fixture plan left free.";

if (raw.plan !== "free" || raw.atCap !== true) {
  console.error("FAIL: raw fixture mode expected free + atCap");
  process.exit(1);
}
if (founding.plan !== "local_autopilot" || founding.atCap !== false || founding.locationCap !== 5) {
  console.error("FAIL: founding demo expected local_autopilot cap 5 not atCap");
  process.exit(1);
}
if (fixture.org.plan !== "free") {
  console.error("FAIL: raw fixture file must stay plan free");
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, modes: [raw, founding] }, null, 2));
process.exit(0);
