/**
 * Stripe webhook → updates orgs.plan / stripe_subscription_id.
 *
 * Verifies the signature with STRIPE_WEBHOOK_SECRET. Idempotent: writes are
 * keyed by stripe_subscription_id / org id so retried webhooks converge.
 *
 * Money Farm Founding: checkout.session.completed + subscription events set
 * plan → local_autopilot when price maps via STRIPE_PRICE_FOUNDING (or
 * session metadata plan=Founding / maps_to_plan=local_autopilot).
 */
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { dbAsService } from "@/lib/db/client";
import { FOUNDING, loadStripePriceMap } from "@/lib/billing/money-farm";
import { stripe } from "@/lib/billing/stripe";
import type { PlanTier } from "@/lib/db/types";

export const runtime = "nodejs";
export const maxDuration = 30;

function planFromPriceId(priceId: string, priceToPlan: Record<string, PlanTier>): PlanTier | null {
  if (!priceId) return null;
  return priceToPlan[priceId] ?? null;
}

function foundingFromMetadata(meta: Stripe.Metadata | null | undefined): boolean {
  if (!meta) return false;
  const plan = (meta.plan || meta.maps_to_plan || meta.nemo_offer || "").toLowerCase();
  return (
    plan === "founding" ||
    plan === "local_autopilot" ||
    meta.maps_to_plan === "local_autopilot" ||
    meta.nemo_offer === "founding"
  );
}

async function applyOrgBilling(args: {
  orgId?: string | null;
  customerId?: string | null;
  subscriptionId?: string | null;
  plan: PlanTier;
}) {
  const db = dbAsService();
  const patch: Record<string, unknown> = {
    plan: args.plan,
    updated_at: new Date().toISOString(),
  };
  if (args.customerId) patch.stripe_customer_id = args.customerId;
  if (args.subscriptionId) patch.stripe_subscription_id = args.subscriptionId;

  if (args.orgId) {
    await db.from("orgs").update(patch).eq("id", args.orgId);
    return;
  }
  if (args.customerId) {
    await db.from("orgs").update(patch).eq("stripe_customer_id", args.customerId);
  }
}

export async function POST(req: Request) {
  const priceToPlan = loadStripePriceMap();
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const body = await req.text();
  if (!sig || !secret) return NextResponse.json({ error: "no_sig" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, sig, secret);
  } catch (e) {
    return NextResponse.json({ error: "bad_sig", detail: String(e) }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId =
        session.client_reference_id ||
        session.metadata?.org_id ||
        null;
      const customerId =
        typeof session.customer === "string"
          ? session.customer
          : session.customer?.id ?? null;
      const subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id ?? null;

      let plan: PlanTier = "free";
      // Prefer explicit price map; Founding Checkout also stamps metadata.plan=Founding
      if (foundingFromMetadata(session.metadata)) {
        plan = FOUNDING.mapsToPlan;
      } else if (subscriptionId) {
        try {
          const sub = await stripe().subscriptions.retrieve(subscriptionId);
          const priceId = sub.items.data[0]?.price?.id ?? "";
          plan = planFromPriceId(priceId, priceToPlan) ?? "free";
        } catch {
          plan = foundingFromMetadata(session.metadata) ? FOUNDING.mapsToPlan : "free";
        }
      }

      // Paid founding checkout (subscription mode) → local_autopilot
      if (
        session.mode === "subscription" &&
        (session.payment_status === "paid" || session.status === "complete") &&
        plan === "free" &&
        foundingFromMetadata(session.metadata)
      ) {
        plan = FOUNDING.mapsToPlan;
      }

      if (orgId || customerId) {
        await applyOrgBilling({
          orgId,
          customerId,
          subscriptionId,
          plan: plan === "free" && foundingFromMetadata(session.metadata)
            ? FOUNDING.mapsToPlan
            : plan,
        });
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const priceId = sub.items.data[0]?.price?.id ?? "";
      const orgId = sub.metadata?.org_id || null;
      const mapped = planFromPriceId(priceId, priceToPlan);
      const plan: PlanTier =
        sub.status === "active" || sub.status === "trialing"
          ? mapped ??
            (foundingFromMetadata(sub.metadata) ? FOUNDING.mapsToPlan : "free")
          : "free";
      await applyOrgBilling({
        orgId,
        customerId,
        subscriptionId: sub.id,
        plan,
      });
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const db = dbAsService();
      await db
        .from("orgs")
        .update({
          plan: "free",
          stripe_subscription_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", sub.id);
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
