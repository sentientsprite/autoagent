/**
 * Stripe webhook → updates orgs.plan / stripe_subscription_id.
 *
 * Verifies the signature with STRIPE_WEBHOOK_SECRET. Idempotent: writes are
 * keyed by stripe_subscription_id so retried webhooks converge.
 */
import { NextResponse } from "next/server";
import type Stripe from "stripe";

import { dbAsService } from "@/lib/db/client";
import { loadStripePriceMap } from "@/lib/billing/money-farm";
import { stripe } from "@/lib/billing/stripe";
import type { PlanTier } from "@/lib/db/types";

export const runtime = "nodejs";
export const maxDuration = 30;

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

  const db = dbAsService();

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
      const priceId = sub.items.data[0]?.price?.id ?? "";
      // Founding $199 ≤5 locs → local_autopilot (Money Farm P0).
      const plan: PlanTier = sub.status === "active" || sub.status === "trialing"
        ? priceToPlan[priceId] ?? "free"
        : "free";
      await db.from("orgs")
        .update({ plan, stripe_customer_id: customerId, stripe_subscription_id: sub.id })
        .eq("stripe_customer_id", customerId);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await db.from("orgs")
        .update({ plan: "free", stripe_subscription_id: null })
        .eq("stripe_subscription_id", sub.id);
      break;
    }
    default:
      // Ignore other events for now; checkout.session.completed is handled via the
      // on-success page that creates the org and links stripe_customer_id.
      break;
  }

  return NextResponse.json({ received: true });
}
