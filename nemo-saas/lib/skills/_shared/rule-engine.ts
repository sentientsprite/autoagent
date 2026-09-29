/**
 * Rule engine — ported from DGTL-MKTG-ASST-main/background.js (analyzeDataWithAI).
 *
 * Original lived in a Chrome extension and ran client-side. Here it lives
 * server-side, is tenant-aware, and emits structured Insight objects with
 * stable ids so the UI can dedupe across runs and the Harbor verifier can
 * assert "this rule must fire on this fixture".
 *
 * Insights are deterministic — no LLM calls happen here. Narrative skills
 * consume Insight[] and turn them into prose.
 */

export type InsightSeverity = "critical" | "warning" | "info" | "win";

export interface Insight {
  /** Stable rule id, e.g. "ga.traffic_drop". Used by Harbor verifiers. */
  id: string;
  severity: InsightSeverity;
  title: string;
  message: string;
  /** Suggested next action — short, imperative. */
  action: string;
  /** Optional structured evidence the LLM/UI can render. */
  evidence?: Record<string, string | number | boolean>;
}

// =============================================================================
// GA4 health rules
// =============================================================================

export interface Ga4Window {
  sessions: number;
  users: number;
  bounceRate: number;          // 0..1
  avgSessionDurationSec: number;
  channels: Partial<Record<"organic" | "paid" | "direct" | "social" | "referral" | "email", number>>;
}

export interface Ga4Comparison {
  current: Ga4Window;
  prior: Ga4Window;             // same length window immediately before `current`
}

export function ga4Insights(c: Ga4Comparison): Insight[] {
  const out: Insight[] = [];
  const sessionDelta = pctDelta(c.current.sessions, c.prior.sessions);

  if (sessionDelta <= -0.15) {
    out.push({
      id: "ga.traffic_drop",
      severity: "critical",
      title: "Traffic dropped sharply",
      message: `Sessions down ${pct(sessionDelta)} vs the prior period.`,
      action: "Investigate top losing pages and channels; check for tracking outages first.",
      evidence: { sessionDelta, current: c.current.sessions, prior: c.prior.sessions },
    });
  } else if (sessionDelta >= 0.2) {
    out.push({
      id: "ga.traffic_spike",
      severity: "win",
      title: "Traffic up materially",
      message: `Sessions up ${pct(sessionDelta)} vs the prior period.`,
      action: "Identify the source so you can double down before it cools.",
      evidence: { sessionDelta },
    });
  }

  if (c.current.bounceRate >= 0.6) {
    out.push({
      id: "ga.high_bounce",
      severity: "warning",
      title: "Bounce rate is high",
      message: `${(c.current.bounceRate * 100).toFixed(0)}% of sessions bounced.`,
      action: "Audit landing pages for slow load, unclear above-the-fold, weak CTAs.",
      evidence: { bounceRate: c.current.bounceRate },
    });
  }

  const paid = c.current.channels.paid ?? 0;
  const total = totalChannels(c.current.channels);
  if (paid / Math.max(total, 1) > 0.3 && c.current.bounceRate >= 0.55) {
    out.push({
      id: "ga.ad_waste",
      severity: "critical",
      title: "Ads bouncing at scale",
      message: `Paid is ${(paid / total * 100).toFixed(0)}% of traffic and bouncing at ${(c.current.bounceRate * 100).toFixed(0)}%.`,
      action: "Tighten match types, add negative keywords, or pause underperforming ad groups.",
      evidence: { paidShare: paid / total, bounceRate: c.current.bounceRate },
    });
  }

  const organic = c.current.channels.organic ?? 0;
  if (organic / Math.max(total, 1) < 0.2) {
    out.push({
      id: "ga.seo_opportunity",
      severity: "info",
      title: "Organic traffic is underweight",
      message: `Organic is only ${(organic / total * 100).toFixed(0)}% of total sessions.`,
      action: "Run gsc_opportunity_finder and ship 2 content pieces against the top gaps.",
      evidence: { organicShare: organic / total },
    });
  }

  if (c.current.avgSessionDurationSec < 30) {
    out.push({
      id: "ga.shallow_engagement",
      severity: "warning",
      title: "Sessions are very short",
      message: `Average session is ${c.current.avgSessionDurationSec}s.`,
      action: "Add internal links, expand thin pages, surface related content.",
      evidence: { avgSessionDurationSec: c.current.avgSessionDurationSec },
    });
  }

  return out;
}

// =============================================================================
// GBP / local visibility rules — new, home-services flavored
// =============================================================================

export interface GbpProfile {
  hasName: boolean;
  hasAddress: boolean;
  hasPhone: boolean;
  hasWebsite: boolean;
  hasHours: boolean;
  hasPrimaryCategory: boolean;
  photoCount: number;
  serviceAreaZipCount: number;
  expectedServiceAreaZipCount: number; // from sites.service_area_zips
  reviewCount: number;
  avgRating: number;                    // 0..5
  reviewsLast90d: number;
  /** Service-area contractor — no storefront address in Places is normal. */
  pureServiceAreaBusiness?: boolean;
}

export function gbpInsights(p: GbpProfile): Insight[] {
  const out: Insight[] = [];

  const missing: string[] = [];
  if (!p.hasPhone) missing.push("phone");
  if (!p.hasWebsite) missing.push("website");
  if (!p.hasHours) missing.push("business hours");
  if (!p.hasPrimaryCategory) missing.push("primary category");
  if (!p.pureServiceAreaBusiness && !p.hasAddress) missing.push("address");
  if (missing.length > 0) {
    out.push({
      id: "gbp.profile_incomplete",
      severity: "critical",
      title: "Google Business Profile is incomplete",
      message: `Missing: ${missing.join(", ")}.`,
      action: "Fill these in inside business.google.com — completed profiles get more calls.",
      evidence: { missing: missing.join(",") },
    });
  }

  if (p.pureServiceAreaBusiness) {
    out.push({
      id: "gbp.service_area_listing",
      severity: "info",
      title: "Service-area Google listing (no storefront pin)",
      message:
        "This is a mobile / service-area contractor profile. Google may not show a street address — optimize service cities, categories, and reviews instead.",
      action: "In GBP, confirm every city you serve is listed in the service area and match website + phone.",
      evidence: { pureServiceAreaBusiness: true },
    });
  }

  if (p.photoCount < 10) {
    out.push({
      id: "gbp.thin_photos",
      severity: "warning",
      title: "Too few photos on your GBP",
      message: `Only ${p.photoCount} photos. Listings with 10+ photos get materially more clicks.`,
      action: "Upload 10 fresh job photos this week (before/after sells best for home services).",
      evidence: { photoCount: p.photoCount },
    });
  }

  if (p.serviceAreaZipCount < p.expectedServiceAreaZipCount) {
    out.push({
      id: "gbp.service_area_gaps",
      severity: "warning",
      title: "Service-area coverage gaps",
      message: `GBP lists ${p.serviceAreaZipCount} zips, but your profile expects ${p.expectedServiceAreaZipCount}.`,
      action: "Add missing zips so neighboring searches surface your business.",
      evidence: {
        gbpZips: p.serviceAreaZipCount,
        expectedZips: p.expectedServiceAreaZipCount,
      },
    });
  }

  if (p.reviewsLast90d < 3) {
    out.push({
      id: "gbp.low_review_velocity",
      severity: "warning",
      title: "Reviews have stalled",
      message: `Only ${p.reviewsLast90d} new reviews in the last 90 days.`,
      action: "Trigger the reputation_loop SMS template after each completed job.",
      evidence: { reviewsLast90d: p.reviewsLast90d },
    });
  }

  if (p.avgRating < 4.2 && p.reviewCount >= 10) {
    out.push({
      id: "gbp.rating_under_4_2",
      severity: "critical",
      title: "Average rating below 4.2",
      message: `Average ${p.avgRating.toFixed(1)} from ${p.reviewCount} reviews — most home-services buyers filter at 4.2+.`,
      action: "Reply to every 1–3 star review professionally; ramp positive review velocity.",
      evidence: { avgRating: p.avgRating, reviewCount: p.reviewCount },
    });
  }

  return out;
}

// =============================================================================
// Local city presence (25mi radius) — Places public data, no GBP OAuth
// =============================================================================

export interface LocalPresenceProfile {
  city: string;
  region?: string;
  radiusMi: number;
  distanceFromCityMi: number | null;
  withinRadius: boolean | null;
  competitorCount: number;
  listingRating: number;
  listingReviews: number;
  medianCompetitorRating: number | null;
  medianCompetitorReviews: number | null;
  primaryCategory?: string;
}

export function localPresenceInsights(p: LocalPresenceProfile): Insight[] {
  const out: Insight[] = [];
  const cityLabel = p.region ? `${p.city}, ${p.region}` : p.city;

  if (p.withinRadius === true) {
    out.push({
      id: "gbp.local_presence_ok",
      severity: "win",
      title: `Present in the ${p.radiusMi}-mile ${p.city} market`,
      message: `Your Google listing sits about ${p.distanceFromCityMi ?? "?"} mi from ${cityLabel} — inside the local search radius buyers use.`,
      action: "Keep NAP + photos fresh so Maps keeps showing you for nearby jobs.",
      evidence: {
        city: cityLabel,
        radiusMi: p.radiusMi,
        distanceMi: p.distanceFromCityMi ?? 0,
      },
    });
  } else if (p.withinRadius === false) {
    out.push({
      id: "gbp.outside_local_radius",
      severity: "critical",
      title: `Listing is outside the ${p.radiusMi}-mile local market`,
      message: `Pin is ~${p.distanceFromCityMi} mi from ${cityLabel}. Nearby searches in that city may skip you.`,
      action: `Confirm the service-area / pin for ${p.city} in business.google.com, or run the audit with the city where the truck actually works.`,
      evidence: {
        city: cityLabel,
        radiusMi: p.radiusMi,
        distanceMi: p.distanceFromCityMi ?? 0,
      },
    });
  }

  if (p.competitorCount >= 3) {
    out.push({
      id: "gbp.local_competition",
      severity: "info",
      title: `Busy ${p.radiusMi}-mile competitive set`,
      message: `We found ${p.competitorCount} similar ${p.primaryCategory?.replace(/_/g, " ") || "local"} listings near ${cityLabel}.`,
      action: "Differentiate with category accuracy, job photos, and review replies — not more citation spam.",
      evidence: { competitorCount: p.competitorCount, city: cityLabel },
    });
  } else if (p.competitorCount === 0 && p.withinRadius !== false) {
    out.push({
      id: "gbp.thin_local_category",
      severity: "info",
      title: "Few category peers in this city radius",
      message: `Almost no same-category competitors showed up within ${p.radiusMi} mi of ${cityLabel}.`,
      action: "Double-check primary category on GBP — wrong type hides you from the right searches.",
      evidence: { competitorCount: 0, city: cityLabel },
    });
  }

  if (
    p.medianCompetitorRating != null &&
    p.listingRating > 0 &&
    p.listingRating + 0.15 < p.medianCompetitorRating &&
    p.listingReviews >= 5
  ) {
    out.push({
      id: "gbp.behind_local_ratings",
      severity: "warning",
      title: "Rating trails local peers",
      message: `You average ${p.listingRating.toFixed(1)}; nearby peers median ~${p.medianCompetitorRating.toFixed(1)} within ${p.radiusMi} mi of ${cityLabel}.`,
      action: "Prioritize review replies and ask happy customers for fresh 5-stars after completed jobs.",
      evidence: {
        listingRating: p.listingRating,
        peerMedian: p.medianCompetitorRating,
      },
    });
  }

  if (
    p.medianCompetitorReviews != null &&
    p.listingReviews < p.medianCompetitorReviews * 0.5 &&
    p.medianCompetitorReviews >= 10
  ) {
    out.push({
      id: "gbp.behind_local_review_volume",
      severity: "warning",
      title: "Fewer reviews than local peers",
      message: `You have ${p.listingReviews} reviews; peers near ${cityLabel} median ~${Math.round(p.medianCompetitorReviews)}.`,
      action: "Install a post-job review ask (SMS/QR) until you clear the local median.",
      evidence: {
        listingReviews: p.listingReviews,
        peerMedianReviews: p.medianCompetitorReviews,
      },
    });
  }

  return out;
}

// =============================================================================
// NAP (name/address/phone) consistency
// =============================================================================

export interface NapRecord {
  source: string;        // e.g. "google", "yelp", "bbb", "facebook"
  name: string | null;
  address: string | null;
  phone: string | null;
}

export interface NapCheck {
  truth: { name: string; address: string; phone: string };
  records: NapRecord[];
}

export function napInsights(c: NapCheck): Insight[] {
  const inconsistencies = c.records.filter((r) => {
    return (
      (r.name && normalize(r.name) !== normalize(c.truth.name)) ||
      (r.address && normalize(r.address) !== normalize(c.truth.address)) ||
      (r.phone && digits(r.phone) !== digits(c.truth.phone))
    );
  });

  if (inconsistencies.length === 0) return [];

  return [
    {
      id: "nap.inconsistent",
      severity: "warning",
      title: "Business listing details don't match",
      message: `${inconsistencies.length} of ${c.records.length} directories show different info than your website.`,
      action: "Standardize name/address/phone across these directories: " +
        inconsistencies.map((r) => r.source).join(", "),
      evidence: { sources: inconsistencies.map((r) => r.source).join(",") },
    },
  ];
}

// =============================================================================
// On-page LocalBusiness schema (GEO / AI citation adjacency)
// =============================================================================

export interface SchemaCheck {
  hasSchemaLocalBusiness: boolean;
  websiteUrl: string;
}

export function schemaInsights(c: SchemaCheck): Insight[] {
  if (c.hasSchemaLocalBusiness) {
    return [
      {
        id: "schema.localbusiness_ok",
        severity: "win",
        title: "Site has LocalBusiness-style structured data",
        message: "JSON-LD on the website includes LocalBusiness / Organization / ProfessionalService.",
        action: "Keep NAP in schema identical to Google Business Profile and the footer.",
        evidence: { websiteUrl: c.websiteUrl },
      },
    ];
  }
  return [
    {
      id: "schema.localbusiness_missing",
      severity: "warning",
      title: "No LocalBusiness schema detected on the website",
      message:
        "We didn’t find JSON-LD for LocalBusiness / Organization / ProfessionalService — AI answers and rich results prefer clear entity markup that matches your GBP NAP.",
      action:
        "Add trade-specific LocalBusiness JSON-LD (name, phone, address or areaServed, url) matching Google Business Profile exactly.",
      evidence: { websiteUrl: c.websiteUrl },
    },
  ];
}

// =============================================================================
// helpers
// =============================================================================

function pctDelta(current: number, prior: number): number {
  if (prior === 0) return current === 0 ? 0 : 1;
  return (current - prior) / prior;
}

function pct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

function totalChannels(c: Ga4Window["channels"]): number {
  return Object.values(c).reduce<number>((s, v) => s + (v ?? 0), 0);
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^\w\s]/g, "").replace(/\s+/g, " ").trim();
}

function digits(s: string): string {
  return s.replace(/\D/g, "");
}
