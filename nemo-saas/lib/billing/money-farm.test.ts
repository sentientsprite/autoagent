import { afterEach, describe, expect, it } from "vitest";

import {
  FOUNDING,
  createBillingPortal,
  createFoundingCheckout,
  foundingPriceId,
  loadStripePriceMap,
  locationCap,
  stripeConfigured,
} from "@/lib/billing/money-farm";

afterEach(() => {
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_PRICE_FOUNDING;
});

describe("money-farm founding helpers", () => {
  it("founding constants + caps", () => {
    expect(FOUNDING.amountCents).toBe(19_900);
    expect(FOUNDING.includedLocations).toBe(5);
    expect(FOUNDING.mapsToPlan).toBe("local_autopilot");
    expect(locationCap("local_autopilot")).toBe(5);
    expect(locationCap("free")).toBe(1);
  });

  it("mock checkout when Stripe unset", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    delete process.env.STRIPE_PRICE_FOUNDING;
    expect(stripeConfigured()).toBe(false);
    expect(foundingPriceId()).toBeNull();
    const r = await createFoundingCheckout({
      orgId: "00000000-0000-0000-0000-000000000001",
      customerEmail: "pilot@example.com",
      successUrl: "http://localhost:3000/ok",
      cancelUrl: "http://localhost:3000/cancel",
    });
    expect(r.mode).toBe("mock");
    expect(r.url).toMatch(/^https:\/\/mock\.stripe\.local\/checkout\//);
  });

  it("mock portal when Stripe unset", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const r = await createBillingPortal({
      customerId: "cus_test",
      returnUrl: "http://localhost:3000/account",
    });
    expect(r.mode).toBe("mock");
    expect(r.url).toBe("https://mock.stripe.local/portal/cus_test");
  });

  it("price map includes founding when set", () => {
    process.env.STRIPE_PRICE_FOUNDING = "price_test_founding";
    const map = loadStripePriceMap();
    expect(map.price_test_founding).toBe("local_autopilot");
  });
});
