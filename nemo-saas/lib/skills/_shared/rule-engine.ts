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
}

export function gbpInsights(p: GbpProfile): Insight[] {
  const out: Insight[] = [];

  const missing: string[] = [];
  if (!p.hasPhone) missing.push("phone");
  if (!p.hasWebsite) missing.push("website");
  if (!p.hasHours) missing.push("business hours");
  if (!p.hasPrimaryCategory) missing.push("primary category");
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
