/**
 * Google Places for the wedge — city-first, 25mi local presence.
 *
 * No GBP OAuth: public Places fields only. Ranking and competitor scan
 * bias to a circle around the owner's city (LOCAL_RADIUS_MI).
 */
import pLimit from "p-limit";

import type { GbpProfile, NapRecord } from "@/lib/skills/_shared/rule-engine";
import { snapshot } from "@/lib/crawler/client";

const PLACES_KEY = (process.env.GOOGLE_MAPS_API_KEY ?? "").trim();
const limit = pLimit(4);

/** Local market radius for presence + competitor scans (Google max bias circle = 50km). */
export const LOCAL_RADIUS_MI = 25;
export const LOCAL_RADIUS_M = Math.min(50_000, LOCAL_RADIUS_MI * 1609.344);

/** True when a Google Places / Maps API key is configured for live GBP lookup. */
export function isPlacesConfigured(): boolean {
  return Boolean(PLACES_KEY);
}

export interface PlaceLookup {
  businessName: string;
  /** Primary geo — city name (Google local is city-shaped, not ZIP). */
  city?: string;
  region?: string;
  zip?: string;
  websiteUrl?: string;
  /** Optional Google Maps share / place URL — used when text search misses SAB listings. */
  googleMapsUrl?: string;
}

export interface LatLng {
  lat: number;
  lng: number;
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
  location?: LatLng;
  /** Mobile / service-area contractor — often no street address in Places. */
  pureServiceAreaBusiness?: boolean;
}

export interface CompetitorSample {
  placeId: string;
  name: string;
  rating?: number;
  reviewCount?: number;
  distanceMi?: number;
}

export interface LocalPresenceScan {
  city: string;
  region?: string;
  radiusMi: number;
  cityCenter: LatLng | null;
  /** Miles from city center to the matched listing (if both known). */
  distanceFromCityMi: number | null;
  /** Listing is inside the 25mi local market. */
  withinRadius: boolean | null;
  competitorCount: number;
  competitors: CompetitorSample[];
  medianCompetitorRating: number | null;
  medianCompetitorReviews: number | null;
}

const SEARCH_FIELD_MASK =
  "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber," +
  "places.websiteUri,places.rating,places.userRatingCount,places.primaryType," +
  "places.regularOpeningHours,places.photos,places.location,places.pureServiceAreaBusiness";

const PLACE_GET_FIELD_MASK =
  "id,displayName,formattedAddress,nationalPhoneNumber,websiteUri,rating,userRatingCount," +
  "primaryType,regularOpeningHours,photos,location,pureServiceAreaBusiness";

/** Strip legal/region noise that breaks Places text search ("Superior Sealing UT"). */
export function normalizeBusinessName(name: string): string {
  return name
    .replace(
      /\b(llc|l\.l\.c\.|inc|incorporated|co|company|corp|corporation|ltd|limited)\b\.?/gi,
      " ",
    )
    .replace(/\b(ut|utah)\b\.?/gi, " ")
    .replace(/[|,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function hostnameFromUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return null;
  }
}

/** Haversine distance in miles. */
export function milesBetween(a: LatLng, b: LatLng): number {
  const R = 3958.7613;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function scoreCandidate(
  p: PlaceRaw,
  wantName: string,
  host: string | null,
): number {
  let score = 0;
  const name = (p.displayName?.text ?? "").toLowerCase();
  const want = wantName.toLowerCase();
  if (want && name) {
    if (name === want) score += 60;
    else if (name.includes(want) || want.includes(name)) score += 40;
    else {
      const wantTokens = want.split(/\s+/).filter((t) => t.length > 2);
      const hits = wantTokens.filter((t) => name.includes(t)).length;
      if (wantTokens.length && hits === wantTokens.length) score += 30;
      else if (hits > 0) score += 10 * hits;
    }
  }
  if (host && p.websiteUri) {
    const ph = hostnameFromUrl(p.websiteUri);
    if (ph && (ph === host || ph.endsWith(`.${host}`) || host.endsWith(`.${ph}`))) {
      score += 100;
    }
  }
  return score;
}

function toLatLng(loc?: { latitude?: number; longitude?: number }): LatLng | undefined {
  if (loc?.latitude == null || loc?.longitude == null) return undefined;
  return { lat: loc.latitude, lng: loc.longitude };
}

function toPlaceResult(p: PlaceRaw, fallbackName: string): PlaceResult {
  return {
    placeId: p.id,
    name: p.displayName?.text ?? fallbackName,
    formattedAddress: p.formattedAddress ?? "",
    phone: p.nationalPhoneNumber,
    website: p.websiteUri,
    rating: p.rating,
    userRatingsTotal: p.userRatingCount,
    primaryCategory: p.primaryType,
    photoCount: p.photos?.length ?? 0,
    hours: !!p.regularOpeningHours,
    location: toLatLng(p.location),
    pureServiceAreaBusiness: p.pureServiceAreaBusiness === true,
  };
}

/** Extract listing title from a Google Maps place URL for a targeted search. */
export function businessNameFromMapsUrl(url: string): string | null {
  try {
    const u = new URL(url.trim());
    const m = u.pathname.match(/\/place\/([^/]+)/);
    if (!m?.[1]) return null;
    return decodeURIComponent(m[1].replace(/\+/g, " ")).trim() || null;
  } catch {
    return null;
  }
}

/** Fetch a single place by Places resource id (e.g. ChIJ…). */
export async function fetchPlaceById(placeId: string): Promise<PlaceResult | null> {
  if (!PLACES_KEY || !placeId.trim()) return null;
  const id = placeId.replace(/^places\//, "");
  try {
    const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(id)}`, {
      headers: {
        "X-Goog-Api-Key": PLACES_KEY,
        "X-Goog-FieldMask": PLACE_GET_FIELD_MASK,
      },
    });
    if (!res.ok) return null;
    const p = (await res.json()) as PlaceRaw;
    if (!p?.id) return null;
    return toPlaceResult(p, p.displayName?.text ?? "Business");
  } catch (e) {
    console.warn("fetchPlaceById failed", e);
    return null;
  }
}

function median(nums: number[]): number | null {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

async function searchText(
  textQuery: string,
  pageSize = 5,
  bias?: LatLng | null,
): Promise<PlaceRaw[]> {
  const body: Record<string, unknown> = {
    textQuery,
    pageSize,
    // Home services (concrete, sealing, plumbers) are often service-area-only listings.
    includePureServiceAreaBusinesses: true,
  };
  if (bias) {
    body.locationBias = {
      circle: {
        center: { latitude: bias.lat, longitude: bias.lng },
        radius: LOCAL_RADIUS_M,
      },
    };
  }
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Goog-Api-Key": PLACES_KEY,
      "X-Goog-FieldMask": SEARCH_FIELD_MASK,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) return [];
  const j = (await res.json()) as PlacesSearchTextResponse;
  return j.places ?? [];
}

/** Resolve city center for the 25mi local market. */
export async function geocodeCity(
  city: string,
  region?: string,
): Promise<LatLng | null> {
  if (!PLACES_KEY || !city.trim()) return null;
  const q = [city.trim(), region?.trim()].filter(Boolean).join(", ");
  try {
    const places = await searchText(q, 3);
    for (const p of places) {
      const loc = toLatLng(p.location);
      if (loc) return loc;
    }
  } catch (e) {
    console.warn("geocodeCity failed", e);
  }
  return null;
}

/**
 * Find the business listing, biased to a 25mi circle around the city.
 */
export async function findPlace(q: PlaceLookup): Promise<PlaceResult | null> {
  if (!PLACES_KEY) return null;

  const host = hostnameFromUrl(q.websiteUrl);
  const mapsName = q.googleMapsUrl ? businessNameFromMapsUrl(q.googleMapsUrl) : null;

  // Direct lookup when URL carries a Places resource id (ChIJ… / places/ChIJ…).
  if (q.googleMapsUrl) {
    const cid = q.googleMapsUrl.match(/!1s(ChIJ[\w-]+)/)?.[1]
      ?? q.googleMapsUrl.match(/(ChIJ[\w-]+)/)?.[1];
    if (cid) {
      const direct = await fetchPlaceById(cid);
      if (direct) return direct;
    }
  }
  const cleaned =
    normalizeBusinessName(q.businessName) || q.businessName.trim() || mapsName || "";
  const city = (q.city || "").trim();
  const region = (q.region || "").trim();
  const cityCenter = city ? await geocodeCity(city, region || undefined) : null;

  const queries = [
    mapsName ? [mapsName, city, region].filter(Boolean).join(" ") : "",
    [cleaned, city, region].filter(Boolean).join(" "),
    city ? [cleaned, city].filter(Boolean).join(" ") : "",
    host && city ? `${cleaned} ${city} ${host}` : "",
    host ? `${cleaned} ${host}` : "",
    host ? host : "",
    mapsName ?? "",
    [cleaned, region || "Utah"].filter(Boolean).join(" "),
    cleaned,
    q.zip ? [cleaned, q.zip].filter(Boolean).join(" ") : "",
  ].filter((t, i, arr) => Boolean(t) && arr.indexOf(t) === i);

  try {
    let best: { place: PlaceRaw; score: number } | null = null;

    for (const text of queries) {
      // Try with city bias first, then without (SAB listings sometimes drop out of tight circles).
      for (const bias of [cityCenter, null]) {
        const places = await searchText(text, 8, bias);
        for (const p of places) {
          const score = scoreCandidate(p, cleaned || mapsName || text, host);
          if (!best || score > best.score) best = { place: p, score };
        }
        if (best && best.score >= 100) break;
      }
      if (best && best.score >= 100) break;
    }

    if (best && best.score >= 20) {
      return toPlaceResult(best.place, cleaned || mapsName || "Business");
    }

    // Last resort: search exact Maps URL title without bias.
    if (mapsName) {
      const places = await searchText(mapsName, 10, null);
      for (const p of places) {
        const score = scoreCandidate(p, mapsName, host);
        if (!best || score > best.score) best = { place: p, score };
      }
      if (best && best.score >= 20) {
        return toPlaceResult(best.place, mapsName);
      }
    }

    return null;
  } catch (e) {
    console.warn("findPlace: Places API request failed", e);
    return null;
  }
}

/**
 * Scan same-category competitors inside the 25mi city radius for presence scoring.
 */
export async function scanLocalPresence(
  place: PlaceResult,
  q: PlaceLookup,
): Promise<LocalPresenceScan> {
  const city = (q.city || "").trim() || "local market";
  const region = (q.region || "").trim() || undefined;
  const cityCenter = (await geocodeCity(city, region)) ?? place.location ?? null;

  let distanceFromCityMi: number | null = null;
  let withinRadius: boolean | null = null;
  if (cityCenter && place.location) {
    distanceFromCityMi = Math.round(milesBetween(cityCenter, place.location) * 10) / 10;
    withinRadius = distanceFromCityMi <= LOCAL_RADIUS_MI;
  }

  const competitors: CompetitorSample[] = [];
  const category = place.primaryCategory;
  if (PLACES_KEY && cityCenter && category) {
    const label = category.replace(/_/g, " ");
    const query = `${label} near ${city}${region ? `, ${region}` : ""}`;
    try {
      const nearby = await searchText(query, 12, cityCenter);
      for (const raw of nearby) {
        if (raw.id === place.placeId) continue;
        const loc = toLatLng(raw.location);
        const dist = loc && cityCenter ? milesBetween(cityCenter, loc) : undefined;
        if (dist != null && dist > LOCAL_RADIUS_MI) continue;
        competitors.push({
          placeId: raw.id,
          name: raw.displayName?.text ?? "Competitor",
          rating: raw.rating,
          reviewCount: raw.userRatingCount,
          distanceMi: dist != null ? Math.round(dist * 10) / 10 : undefined,
        });
        if (competitors.length >= 8) break;
      }
    } catch (e) {
      console.warn("scanLocalPresence competitors failed", e);
    }
  }

  const ratings = competitors.map((c) => c.rating).filter((n): n is number => n != null);
  const reviews = competitors
    .map((c) => c.reviewCount)
    .filter((n): n is number => n != null);

  return {
    city,
    region,
    radiusMi: LOCAL_RADIUS_MI,
    cityCenter,
    distanceFromCityMi,
    withinRadius,
    competitorCount: competitors.length,
    competitors,
    medianCompetitorRating: median(ratings),
    medianCompetitorReviews: median(reviews),
  };
}

export function placeToGbpProfile(
  p: PlaceResult,
  expectedServiceAreaZips: number,
  reviewsLast90d?: number,
): GbpProfile {
  const sab = p.pureServiceAreaBusiness === true;
  return {
    hasName: !!p.name,
    hasAddress: sab || !!p.formattedAddress,
    hasPhone: !!p.phone,
    hasWebsite: !!p.website,
    hasHours: !!p.hours,
    hasPrimaryCategory: !!p.primaryCategory,
    photoCount: p.photoCount ?? 0,
    serviceAreaZipCount: 0,
    expectedServiceAreaZipCount: expectedServiceAreaZips,
    reviewCount: p.userRatingsTotal ?? 0,
    avgRating: p.rating ?? 0,
    reviewsLast90d: reviewsLast90d ?? estimateReviewsLast90d(p.userRatingsTotal ?? 0),
    pureServiceAreaBusiness: sab,
  };
}

function estimateReviewsLast90d(total: number): number {
  return Math.round(total / 20);
}

export async function fetchNapRecords(q: PlaceLookup): Promise<NapRecord[]> {
  const queries = buildDirectoryUrls(q);
  const results = await Promise.all(
    queries.map((u) => limit(() => safeSnapshot(u.source, u.url))),
  );
  return results.filter((r): r is NapRecord => !!r);
}

function buildDirectoryUrls(q: PlaceLookup): { source: string; url: string }[] {
  const place = [normalizeBusinessName(q.businessName) || q.businessName, q.city, q.region]
    .filter(Boolean)
    .join(" ");
  const text = encodeURIComponent(place);
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
    return { source, name: null, address: null, phone: null };
  } catch {
    return null;
  }
}

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
  location?: { latitude?: number; longitude?: number };
  pureServiceAreaBusiness?: boolean;
}
