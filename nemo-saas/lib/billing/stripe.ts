import Stripe from "stripe";

import type { JobKind, PlanTier } from "@/lib/db/types";

let cached: Stripe | null = null;

/**
 * True when STRIPE_SECRET_KEY is set. Money Farm P0 / tests run without a key
 * via mock Checkout + Portal URLs. LIVE Stripe = Owner GATE — do not require
 * live keys to verify the mock path.
 */
export function isStripeConfigured(): boolean {
  return Boolean((process.env.STRIPE_SECRET_KEY ?? "").trim());
}

/** Stripe SDK client, or null when STRIPE_SECRET_KEY is unset (mock mode). */
export function stripeMaybe(): Stripe | null {
  if (!isStripeConfigured()) return null;
  if (cached) return cached;
  cached = new Stripe(process.env.STRIPE_SECRET_KEY!.trim());
  return cached;
}

/**
 * Live Stripe client. Throws if STRIPE_SECRET_KEY is missing.
 * Prefer stripeMaybe() / money-farm checkout helpers for test mode.
 */
export function stripe(): Stripe {
  const client = stripeMaybe();
  if (!client) throw new Error("STRIPE_SECRET_KEY missing");
  return client;
}

/** Founding flat: $199/mo ≤5 locations (see also lib/billing/money-farm.ts). */
export const FOUNDING_PLAN = {
  name: "Founding",
  amountCents: 19_900,
  locationCap: 5,
  planTier: "local_autopilot" as PlanTier,
} as const;

/** Mock price id when STRIPE_PRICE_FOUNDING is unset. */
export const MOCK_PRICE_FOUNDING = "price_mock_founding_199";

export function foundingPriceId(): string {
  return (process.env.STRIPE_PRICE_FOUNDING ?? "").trim() || MOCK_PRICE_FOUNDING;
}

/**
 * Plan → allowed scheduled job kinds. Control plane gates which schedules a
 * tenant can create. On-demand LVS audit remains allowed on free.
 */
export const PLAN_JOBS: Record<PlanTier, ReadonlyArray<JobKind>> = {
  free: ["local_visibility_audit"],
  local_autopilot: [
    "local_visibility_audit",
    "ga4_health_brief",
    "reputation_loop",
    "local_landing_builder",
  ],
  growth_operator: [
    "local_visibility_audit",
    "gsc_opportunity_finder",
    "ga4_health_brief",
    "local_landing_builder",
    "paid_qa",
    "reputation_loop",
  ],
  agency: [
    "local_visibility_audit",
    "gsc_opportunity_finder",
    "ga4_health_brief",
    "local_landing_builder",
    "paid_qa",
    "reputation_loop",
    "competitor_pulse",
  ],
};

export function planAllows(plan: PlanTier, kind: JobKind): boolean {
  return PLAN_JOBS[plan].includes(kind);
}

export interface CreateCheckoutSessionArgs {
  orgId: string;
  customerId?: string | null;
  successUrl: string;
  cancelUrl: string;
  priceId?: string;
  customerEmail?: string;
}

export interface CheckoutSessionResult {
  id: string;
  url: string;
  mode: "mock" | "live";
}

export interface CreatePortalSessionArgs {
  customerId: string;
  returnUrl: string;
}

export interface PortalSessionResult {
  id: string;
  url: string;
  mode: "mock" | "live";
}

function mockId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Founding Checkout. When STRIPE_SECRET_KEY unset → mock.stripe.local URL,
 * never calls the SDK. LIVE = Owner GATE.
 */
export async function createCheckoutSession(
  args: CreateCheckoutSessionArgs,
): Promise<CheckoutSessionResult> {
  const priceId = args.priceId ?? foundingPriceId();
  const client = stripeMaybe();

  if (!client) {
    const id = mockId("cs_mock");
    return {
      id,
      url: `https://mock.stripe.local/checkout/${id}`,
      mode: "mock",
    };
  }

  const session = await client.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: args.successUrl,
    cancel_url: args.cancelUrl,
    client_reference_id: args.orgId,
    customer: args.customerId || undefined,
    customer_email: args.customerId ? undefined : args.customerEmail,
    metadata: {
      org_id: args.orgId,
      plan: FOUNDING_PLAN.name,
      location_cap: String(FOUNDING_PLAN.locationCap),
    },
  });

  if (!session.url) throw new Error("stripe_checkout_missing_url");
  return { id: session.id, url: session.url, mode: "live" };
}

/**
 * Customer Portal. When STRIPE_SECRET_KEY unset → mock.stripe.local URL.
 */
export async function createCustomerPortalSession(
  args: CreatePortalSessionArgs,
): Promise<PortalSessionResult> {
  const client = stripeMaybe();
  const customerId = args.customerId.trim() || "cus_mock_local";

  if (!client) {
    const id = mockId("bps_mock");
    return {
      id,
      url: `https://mock.stripe.local/portal/${customerId}`,
      mode: "mock",
    };
  }

  const session = await client.billingPortal.sessions.create({
    customer: customerId,
    return_url: args.returnUrl,
  });
  return { id: session.id, url: session.url, mode: "live" };
}
