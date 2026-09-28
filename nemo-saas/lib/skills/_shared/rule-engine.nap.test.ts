import { describe, expect, it } from "vitest";
import { napInsights } from "./rule-engine";

describe("napInsights", () => {
  it("returns empty when directories match truth", () => {
    const out = napInsights({
      truth: { name: "Hudson Plumbing Co.", address: "1 Pearl St, Boulder, CO 80301", phone: "303-555-0100" },
      records: [
        { source: "yelp", name: "Hudson Plumbing Co.", address: "1 Pearl St, Boulder, CO 80301", phone: "(303) 555-0100" },
        { source: "bbb", name: "Hudson Plumbing Co.", address: "1 Pearl St, Boulder, CO 80301", phone: "3035550100" },
      ],
    });
    expect(out).toEqual([]);
  });

  it("flags nap.inconsistent when a directory phone differs", () => {
    const out = napInsights({
      truth: { name: "Hudson Plumbing Co.", address: "1 Pearl St, Boulder, CO 80301", phone: "303-555-0100" },
      records: [
        { source: "yelp", name: "Hudson Plumbing Co.", address: "1 Pearl St, Boulder, CO 80301", phone: "303-555-0100" },
        { source: "bbb", name: "Hudson Plumbing Co.", address: "1 Pearl St, Boulder, CO 80301", phone: "303-555-9999" },
      ],
    });
    expect(out.map((i) => i.id)).toEqual(["nap.inconsistent"]);
    expect(out[0]?.evidence?.sources).toBe("bbb");
  });
});
