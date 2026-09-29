import { afterEach, describe, expect, it } from "vitest";

import {
  createCheckoutSession,
  createCustomerPortalSession,
  FOUNDING_PLAN,
  foundingPriceId,
  isStripeConfigured,
  isStripeLiveSecret,
  MOCK_PRICE_FOUNDING,
  planAllows,
  stripeLiveAllowed,
  stripeMaybe,
} from "@/lib/billing/stripe";

afterEach(() => {
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_PRICE_FOUNDING;
  delete process.env.ALLOW_STRIPE_LIVE;
});

describe("stripe mock mode (Money Farm P0)", () => {
  it("isStripeConfigured / stripeMaybe null-safe when key unset", () => {
    delete process.env.STRIPE_SECRET_KEY;
    expect(isStripeConfigured()).toBe(false);
    expect(stripeMaybe()).toBeNull();
  });

  it("founding price falls back to mock id", () => {
    delete process.env.STRIPE_PRICE_FOUNDING;
    expect(foundingPriceId()).toBe(MOCK_PRICE_FOUNDING);
    expect(FOUNDING_PLAN.amountCents).toBe(19_900);
    expect(FOUNDING_PLAN.locationCap).toBe(5);
  });

  it("createCheckoutSession returns mock.stripe.local URL", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const session = await createCheckoutSession({
      orgId: "00000000-0000-0000-0000-000000000001",
      successUrl: "http://localhost:3000/success",
      cancelUrl: "http://localhost:3000/cancel",
    });
    expect(session.mode).toBe("mock");
    expect(session.url).toMatch(/^https:\/\/mock\.stripe\.local\/checkout\//);
  });

  it("createCustomerPortalSession returns mock portal URL", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const session = await createCustomerPortalSession({
      customerId: "cus_mock_acme",
      returnUrl: "http://localhost:3000/billing",
    });
    expect(session.mode).toBe("mock");
    expect(session.url).toBe("https://mock.stripe.local/portal/cus_mock_acme");
  });

  it("planAllows keeps free LVS", () => {
    expect(planAllows("free", "local_visibility_audit")).toBe(true);
    expect(planAllows("free", "competitor_pulse")).toBe(false);
  });
});


describe("Stripe LIVE refuse parity (dayshift)", () => {
  it("detects sk_live / rk_live secrets", () => {
    expect(isStripeLiveSecret("sk_live_example")).toBe(true);
    expect(isStripeLiveSecret("rk_live_example")).toBe(true);
    expect(isStripeLiveSecret("sk_test_example")).toBe(false);
    expect(isStripeLiveSecret("")).toBe(false);
  });

  it("refuses LIVE keys unless ALLOW_STRIPE_LIVE=1 (mock path)", async () => {
    process.env.STRIPE_SECRET_KEY = "sk_live_dayshift_refuse_example";
    delete process.env.ALLOW_STRIPE_LIVE;
    expect(stripeLiveAllowed()).toBe(false);
    expect(isStripeConfigured()).toBe(false);
    expect(stripeMaybe()).toBeNull();
    const session = await createCheckoutSession({
      orgId: "00000000-0000-0000-0000-000000000002",
      successUrl: "http://localhost:3000/success",
      cancelUrl: "http://localhost:3000/cancel",
    });
    expect(session.mode).toBe("mock");
    expect(session.url).toMatch(/^https:\/\/mock\.stripe\.local\/checkout\//);
  });

  it("allows LIVE only with explicit ALLOW_STRIPE_LIVE=1 flag (configured gate)", () => {
    process.env.STRIPE_SECRET_KEY = "sk_live_dayshift_refuse_example";
    process.env.ALLOW_STRIPE_LIVE = "1";
    expect(stripeLiveAllowed()).toBe(true);
    expect(isStripeConfigured()).toBe(true);
    // Do not call Stripe SDK with a fake live key — only assert the gate opens.
  });
});
