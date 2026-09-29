/**
 * POST /api/stripe/activate-founding
 * Success-page helper: set org.plan → local_autopilot after Checkout (or mock).
 * Live subscription ids still owned by webhook when Stripe is configured.
 */
import { NextResponse } from "next/server";
import { z } from "zod";

import { activateFoundingForOrg, FOUNDING } from "@/lib/billing/money-farm";

export const runtime = "nodejs";
export const maxDuration = 30;

const Body = z.object({
  orgId: z.string().uuid(),
  sessionId: z.string().min(3).optional(),
  /** Default mock when Stripe unset or session looks like cs_mock_* */
  mode: z.enum(["mock", "live"]).optional(),
});

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: "invalid_input", detail: String(e) }, { status: 400 });
  }

  const looksMock =
    !process.env.STRIPE_SECRET_KEY?.trim() ||
    Boolean(parsed.sessionId?.startsWith("cs_mock_") || parsed.sessionId?.startsWith("mock_"));
  const mode = parsed.mode ?? (looksMock ? "mock" : "live");

  try {
    const result = await activateFoundingForOrg({
      orgId: parsed.orgId,
      mode,
      sessionId: parsed.sessionId,
    });
    return NextResponse.json({
      ...result,
      offer: FOUNDING.label,
      amountCents: FOUNDING.amountCents,
      note:
        mode === "mock"
          ? "Mock activate — no Stripe charge. Live Stripe = Owner spend GATE."
          : "Plan set; prefer webhook for subscription id sync.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: "activate_failed", detail: String(e) },
      { status: 500 },
    );
  }
}
