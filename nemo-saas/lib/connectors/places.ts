/**
 * Google Places (and a thin Yelp/BBB scrape via the crawler) for the wedge.
 *
 * The wedge runs WITHOUT user OAuth — we use the public Places API key to
 * fetch the GBP-equivalent profile and a few directory pages to build a
 * NapCheck. Everything here is read-only and rate-limited by p-limit.
 */
import pLimit from "p-limit";

import type { GbpProfile, NapRecord } from "@/lib/skills/_shared/rule-engine";
import { snapshot } from "@/lib/crawler/client";

const PLACES_KEY = process.env.GOOGLE_MAPS_API_KEY ?? "";
const limit = pLimit(4);

export interface PlaceLookup {
  businessName: string;
  zip: string;
  city?: string;
  region?: string;
}

export interface PlaceResult {
  placeId: string;
  name: string;
  formattedAddress: string;
  phone?: string;
  website?: string;
  rating?: number;
  userRatingsTotal?: number;
  primaryCategory?: string;
  photoCount?: number;
  hours?: boolean;
}

/**
 * Find a place by free-text query. Returns null if Places key is missing
 * (so the wedge still runs against fixtures).
 */
export async function findPlace(q: PlaceLookup): Promise<PlaceResult | null> {
  if (!PLACES_KEY) return null;

  try {
    const text = [q.businessName, q.city, q.region, q.zip].filter(Boolean).join(" ");
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-Goog-Api-Key": PLACES_KEY,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber," +
          "places.websiteUri,places.rating,places.userRatingCount,places.primaryType," +
          "places.regularOpeningHours,places.photos",
      },
      body: JSON.stringify({ textQuery: text, pageSize: 1 }),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as PlacesSearchTextResponse;
    const p = j.places?.[0];
    if (!p) return null;
    return {
    placeId: p.id,
    name: p.displayName?.text ?? q.businessName,
    formattedAddress: p.formattedAddress ?? "",
    phone: p.nationalPhoneNumber,
    website: p.websiteUri,
    rating: p.rating,
    userRatingsTotal: p.userRatingCount,
    primaryCategory: p.primaryType,
    photoCount: p.photos?.length ?? 0,
    hours: !!p.regularOpeningHours,
  };
  } catch (e) {
    console.warn("findPlace: Places API request failed", e);
    return null;
  }
}

/**
 * Build the GbpProfile shape the rule engine expects from a PlaceResult plus
 * site context. For the wedge we don't have the GBP-managed signals (reviews
 * last 90d, posts), so we approximate from public fields and flag uncertainty
 * in the audit output.
 */
export function placeToGbpProfile(p: PlaceResult, expectedServiceAreaZips: number, reviewsLast90d?: number): GbpProfile {
  return {
    hasName: !!p.name,
    hasAddress: !!p.formattedAddress,
    hasPhone: !!p.phone,
    hasWebsite: !!p.website,
    hasHours: !!p.hours,
    hasPrimaryCategory: !!p.primaryCategory,
    photoCount: p.photoCount ?? 0,
    serviceAreaZipCount: 0,                 // unknown without GBP OAuth
    expectedServiceAreaZipCount: expectedServiceAreaZips,
    reviewCount: p.userRatingsTotal ?? 0,
    avgRating: p.rating ?? 0,
    reviewsLast90d: reviewsLast90d ?? estimateReviewsLast90d(p.userRatingsTotal ?? 0),
  };
}

function estimateReviewsLast90d(total: number): number {
  // Coarse heuristic when we don't have real time-series data: assume reviews
  // arrive at a steady rate over 5 years. Wedge reports flag this as estimate.
  return Math.round(total / 20);
}

/**
 * Fetch a few public directory pages and pull NAP fields. We use the crawler
 * snapshot endpoint (not the Yelp/BBB APIs) so the wedge stays free.
 *
 * Best-effort and silent on failure — we'd rather show 3 directory rows than
 * break the wedge if Yelp gates us.
 */
export async function fetchNapRecords(q: PlaceLookup): Promise<NapRecord[]> {
  const queries = buildDirectoryUrls(q);
  const results = await Promise.all(
    queries.map((u) => limit(() => safeSnapshot(u.source, u.url))),
  );
  return results.filter((r): r is NapRecord => !!r);
}

function buildDirectoryUrls(q: PlaceLookup): { source: string; url: string }[] {
  const text = encodeURIComponent(`${q.businessName} ${q.zip}`);
  return [
    { source: "yelp", url: `https://www.yelp.com/search?find_desc=${text}` },
    { source: "bbb", url: `https://www.bbb.org/search?find_text=${text}` },
    { source: "yellowpages", url: `https://www.yellowpages.com/search?search_terms=${text}` },
  ];
}

async function safeSnapshot(source: string, url: string): Promise<NapRecord | null> {
  try {
    const s = await snapshot(url);
    if (s.status >= 400) return null;
    // We do NOT parse out exact NAP from search-result pages here; the wedge
    // marks these directories as "present" and uses the local_landing_builder
    // skill (paid tier) for deep parsing. This keeps the wedge fast and free.
    return { source, name: null, address: null, phone: null };
  } catch {
    return null;
  }
}

// =============================================================================
// minimal Places API response typing
// =============================================================================

interface PlacesSearchTextResponse {
  places?: PlaceRaw[];
}

interface PlaceRaw {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  primaryType?: string;
  regularOpeningHours?: unknown;
  photos?: unknown[];
}
