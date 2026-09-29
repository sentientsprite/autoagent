import { describe, expect, it } from "vitest";
import { isStripeLiveSecret, stripeLiveAllowed, isStripeConfigured } from "@/lib/billing/stripe";

describe("billing LIVE helper exports", () => {
  it("isStripeLiveSecret / stripeLiveAllowed are callable", () => {
    expect(typeof isStripeLiveSecret).toBe("function");
    expect(typeof stripeLiveAllowed).toBe("function");
    expect(isStripeLiveSecret("sk_test_x")).toBe(false);
    expect(isStripeLiveSecret("sk_live_x")).toBe(true);
    // Do not assert configured against ambient env — only types/callability.
    expect(typeof isStripeConfigured()).toBe("boolean");
  });
});
