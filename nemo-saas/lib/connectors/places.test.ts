import { describe, expect, it } from "vitest";

import {
  businessNameFromMapsUrl,
  hostnameFromUrl,
  milesBetween,
  normalizeBusinessName,
} from "@/lib/connectors/places";

describe("places lookup helpers", () => {
  it("strips UT/Utah noise that broke Superior Sealing search", () => {
    expect(normalizeBusinessName("Superior Sealing UT")).toBe("Superior Sealing");
    expect(normalizeBusinessName("Superior Sealing Utah")).toBe("Superior Sealing");
    expect(normalizeBusinessName("Acme Plumbing LLC")).toBe("Acme Plumbing");
  });

  it("parses business name from Google Maps place URL", () => {
    expect(
      businessNameFromMapsUrl(
        "https://www.google.com/maps/place/Midvalley+Concrete+Repair/@40.51,-112.14,10z/",
      ),
    ).toBe("Midvalley Concrete Repair");
  });

  it("extracts website host for ranking", () => {
    expect(hostnameFromUrl("https://www.superiorsealingutah.com/")).toBe(
      "superiorsealingutah.com",
    );
    expect(hostnameFromUrl("not-a-url")).toBeNull();
  });

  it("measures city radius distance in miles", () => {
    // ~0 mi same point
    expect(milesBetween({ lat: 40.76, lng: -111.89 }, { lat: 40.76, lng: -111.89 })).toBe(0);
    // Salt Lake → roughly Provo is ~40mi (outside 25mi)
    const d = milesBetween({ lat: 40.76, lng: -111.89 }, { lat: 40.23, lng: -111.66 });
    expect(d).toBeGreaterThan(30);
    expect(d).toBeLessThan(55);
  });
});
