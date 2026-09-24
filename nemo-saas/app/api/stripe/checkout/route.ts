/**
 * POST /api/stripe/checkout
 * Money Farm founding Checkout (or mock when Stripe unset / Owner GATE not flipped).
 */
import { NextResponse } from "next/server";
import { z } from "zod";

import { createFoundingCheckout } from "@/lib/billing/money-farm";
import { dbAsService } from "@/lib/db/client";

export const runtime = "nodejs";
export const maxDuration = 30;

const Body = z.object({
  orgId: z.string().uuid(),
  customerEmail: z.string().email(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "invalid_input", detail: String(e) }, { status: 400 });
  }

  const origin = new URL(req.url).origin;
  const successUrl =
    parsed.successUrl ?? `${origin}/billing/success?org=${parsed.orgId}`;
  const cancelUrl = parsed.cancelUrl ?? `${origin}/billing/cancel`;

  let customerId: string | null = null;
  try {
    const db = dbAsService();
    const { data } = await db
      .from("orgs")
      .select("stripe_customer_id")
      .eq("id", parsed.orgId)
      .maybeSingle();
    customerId = data?.stripe_customer_id ?? null;
  } catch {
    // DB optional in local stub — checkout still returns mock
  }

  try {
    const result = await createFoundingCheckout({
      orgId: parsed.orgId,
      customerEmail: parsed.customerEmail,
      successUrl,
      cancelUrl,
      customerId,
    });
    return NextResponse.json({
      ...result,
      offer: "founding",
      note:
        result.mode === "mock"
          ? "Stripe live = Owner spend GATE. Set STRIPE_SECRET_KEY + STRIPE_PRICE_FOUNDING."
          : undefined,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "checkout_failed", detail: String(e) },
      { status: 500 },
    );
  }
}
