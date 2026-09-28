import { describe, expect, it } from "vitest";
import { renderStarterClientMd } from "./client-intelligence";
import type { Site } from "@/lib/db/types";

const site = {
  id: "s1",
  org_id: "o1",
  name: "Hudson Plumbing",
  website_url: "https://hudsonplumbing.example",
  business_name: "Hudson Plumbing Co.",
  street_address: null,
  city: "Boulder",
  region: "CO",
  postal_code: "80301",
  phone: "303-555-0100",
  primary_category: "plumber",
  service_area_zips: ["80301", "80302"],
  google_maps_url: null,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
} as Site;

describe("renderStarterClientMd", () => {
  it("includes business name, category, and SEO/GEO baseline section", () => {
    const md = renderStarterClientMd(site, { goals: ["More Maps calls"] });
    expect(md).toContain("Hudson Plumbing Co.");
    expect(md).toContain("plumber");
    expect(md).toContain("More Maps calls");
    expect(md).toMatch(/SEO|GEO|baseline/i);
  });
});
