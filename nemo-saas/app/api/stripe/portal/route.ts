/**
 * POST /api/stripe/portal
 * Customer billing portal (mock when Stripe unset).
 */
import { NextResponse } from "next/server";
import { z } from "zod";

import { createBillingPortal } from "@/lib/billing/money-farm";
import { dbAsService } from "@/lib/db/client";

export const runtime = "nodejs";
export const maxDuration = 30;

const Body = z.object({
  orgId: z.string().uuid(),
  returnUrl: z.string().url().optional(),
});

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "invalid_input", detail: String(e) }, { status: 400 });
  }

  const origin = new URL(req.url).origin;
  const returnUrl = parsed.returnUrl ?? `${origin}/account`;

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
    /* mock path */
  }

  const result = await createBillingPortal({ customerId, returnUrl });
  return NextResponse.json(result);
}
