/**
 * Money Farm P0 — founding SaaS pricing + location caps.
 * Maps founding Stripe price → existing plan_tier `local_autopilot`
 * (no DB enum migration). Live Stripe requires Owner spend GATE.
 */
import type { PlanTier } from "@/lib/db/types";
import {
  createCheckoutSession,
  createCustomerPortalSession,
  isStripeConfigured,
} from "@/lib/billing/stripe";

/** Founding offer from Zephyr money-farm.md — flat ≤5 locations. */
export const FOUNDING = {
  label: "Founding",
  /** USD cents */
  amountCents: 19_900,
  includedLocations: 5,
  /** Overage messaging only until metered billing ships */
  overagePerLocationCents: 3_900,
  mapsToPlan: "local_autopilot" as PlanTier,
  trialDays: 30,
} as const;

/** Soft caps by plan — HQ rollup later. */
export const LOCATION_CAPS: Record<PlanTier, number> = {
  free: 1,
  local_autopilot: FOUNDING.includedLocations,
  growth_operator: 25,
  agency: 100,
};

export function locationCap(plan: PlanTier): number {
  return LOCATION_CAPS[plan] ?? 1;
}

export function stripeConfigured(): boolean {
  return isStripeConfigured();
}

/** Price id for founding Checkout; empty → mock mode. */
export function foundingPriceId(): string | null {
  const id = process.env.STRIPE_PRICE_FOUNDING?.trim();
  return id || null;
}

export function loadStripePriceMap(): Record<string, PlanTier> {
  const map: Record<string, PlanTier> = {};
  const founding = process.env.STRIPE_PRICE_FOUNDING;
  const local = process.env.STRIPE_PRICE_LOCAL_AUTOPILOT;
  const growth = process.env.STRIPE_PRICE_GROWTH_OPERATOR;
  const agency = process.env.STRIPE_PRICE_AGENCY;
  if (founding) map[founding] = FOUNDING.mapsToPlan;
  if (local) map[local] = "local_autopilot";
  if (growth) map[growth] = "growth_operator";
  if (agency) map[agency] = "agency";
  return map;
}

export type CheckoutResult =
  | { mode: "live"; url: string; sessionId: string }
  | {
      mode: "mock";
      url: string;
      sessionId: string;
      reason: "missing_stripe_key" | "missing_founding_price";
    };

/**
 * Create founding Checkout session, or mock.stripe.local when unset.
 * Never throws on missing keys — P0 must run without Owner GATE spend.
 */
export async function createFoundingCheckout(args: {
  orgId: string;
  customerEmail: string;
  successUrl: string;
  cancelUrl: string;
  customerId?: string | null;
}): Promise<CheckoutResult> {
  const priceId = foundingPriceId();
  if (!stripeConfigured() || !priceId) {
    const reason = !stripeConfigured() ? "missing_stripe_key" : "missing_founding_price";
    const session = await createCheckoutSession({
      orgId: args.orgId,
      customerEmail: args.customerEmail,
      successUrl: args.successUrl,
      cancelUrl: args.cancelUrl,
      customerId: args.customerId,
    });
    return { mode: "mock", url: session.url, sessionId: session.id, reason };
  }

  const session = await createCheckoutSession({
    orgId: args.orgId,
    customerEmail: args.customerEmail,
    successUrl: args.successUrl,
    cancelUrl: args.cancelUrl,
    customerId: args.customerId,
    priceId,
  });
  if (session.mode === "mock") {
    return {
      mode: "mock",
      url: session.url,
      sessionId: session.id,
      reason: "missing_stripe_key",
    };
  }
  return { mode: "live", url: session.url, sessionId: session.id };
}

export type PortalResult =
  | { mode: "live"; url: string }
  | { mode: "mock"; url: string; reason: "missing_stripe_key" | "missing_customer" };

export async function createBillingPortal(args: {
  customerId: string | null | undefined;
  returnUrl: string;
}): Promise<PortalResult> {
  if (!stripeConfigured()) {
    const customerId = args.customerId?.trim() || "cus_mock_local";
    const session = await createCustomerPortalSession({
      customerId,
      returnUrl: args.returnUrl,
    });
    return { mode: "mock", url: session.url, reason: "missing_stripe_key" };
  }
  if (!args.customerId) {
    return { mode: "mock", url: args.returnUrl, reason: "missing_customer" };
  }
  const session = await createCustomerPortalSession({
    customerId: args.customerId,
    returnUrl: args.returnUrl,
  });
  if (session.mode === "mock") {
    return { mode: "mock", url: session.url, reason: "missing_stripe_key" };
  }
  return { mode: "live", url: session.url };
}

/**
 * After Checkout (or mock success), set org.plan → local_autopilot.
 * Mock path: no Stripe SDK. Live path should be driven by webhook; this is a
 * convenience for success-page UX + local pilots.
 */
export async function activateFoundingForOrg(args: {
  orgId: string;
  /** mock | live — live still only writes plan (webhook owns subscription ids) */
  mode: "mock" | "live";
  sessionId?: string | null;
}): Promise<{ orgId: string; plan: PlanTier; locationCap: number; mode: "mock" | "live" }> {
  const { dbAsService } = await import("@/lib/db/client");
  const db = dbAsService();
  const plan = FOUNDING.mapsToPlan;
  const patch: Record<string, unknown> = {
    plan,
    updated_at: new Date().toISOString(),
  };
  if (args.mode === "mock" && args.sessionId) {
    patch.stripe_subscription_id = `sub_mock_${args.sessionId.replace(/^cs_mock_|^mock_cs_/, "").slice(0, 24)}`;
  }
  const { error } = await db.from("orgs").update(patch).eq("id", args.orgId);
  if (error) throw new Error(`activate_founding_failed:${error.message}`);
  return {
    orgId: args.orgId,
    plan,
    locationCap: FOUNDING.includedLocations,
    mode: args.mode,
  };
}

