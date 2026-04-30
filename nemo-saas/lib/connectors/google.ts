/**
 * Google API connector helpers — one OAuth client per request, refresh-token
 * pulled from `connectors` (envelope-decrypted), short-lived in memory.
 *
 * Scopes are minimum-necessary per connector kind; documented in
 * docs/oauth-verification.md for the brand-verification application.
 */
import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";

import { decryptToken } from "@/lib/kms/envelope";
import type { Connector, ConnectorKind } from "@/lib/db/types";

export const SCOPES_BY_KIND: Record<ConnectorKind, string[]> = {
  google_search_console: ["https://www.googleapis.com/auth/webmasters.readonly"],
  google_analytics_4: ["https://www.googleapis.com/auth/analytics.readonly"],
  google_business_profile: [
    "https://www.googleapis.com/auth/business.manage",
  ],
  google_ads: ["https://www.googleapis.com/auth/adwords"],
  meta_ads: [],
};

export function oauthClient(): OAuth2Client {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  const redirect = process.env.GOOGLE_OAUTH_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirect) {
    throw new Error("Google OAuth env vars missing");
  }
  return new google.auth.OAuth2(clientId, clientSecret, redirect);
}

export function authForConnector(c: Connector): OAuth2Client {
  const oauth = oauthClient();
  oauth.setCredentials({
    refresh_token: decryptToken(c.encrypted_refresh_token, c.org_id),
  });
  return oauth;
}

// =============================================================================
// GSC: query daily search performance for a property over a window.
// =============================================================================

export interface GscQueryRow {
  query: string;
  page: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export async function gscQueryByPage(c: Connector, opts: {
  startDate: string;
  endDate: string;
  rowLimit?: number;
}): Promise<GscQueryRow[]> {
  const auth = authForConnector(c);
  const sc = google.searchconsole({ version: "v1", auth });
  const res = await sc.searchanalytics.query({
    siteUrl: c.remote_id,
    requestBody: {
      startDate: opts.startDate,
      endDate: opts.endDate,
      dimensions: ["query", "page"],
      rowLimit: opts.rowLimit ?? 5000,
      type: "web",
    },
  });
  const rows = res.data.rows ?? [];
  return rows.map((r) => ({
    query: r.keys?.[0] ?? "",
    page: r.keys?.[1] ?? "",
    clicks: r.clicks ?? 0,
    impressions: r.impressions ?? 0,
    ctr: r.ctr ?? 0,
    position: r.position ?? 0,
  }));
}

// =============================================================================
// GA4: pull a small set of session/channel metrics over a window.
// =============================================================================

export interface Ga4WindowRaw {
  sessions: number;
  users: number;
  bounceRate: number;
  avgSessionDurationSec: number;
  channels: Record<string, number>;
}

export async function ga4Window(c: Connector, opts: {
  startDate: string;       // 'YYYY-MM-DD' or '7daysAgo'
  endDate: string;
}): Promise<Ga4WindowRaw> {
  const auth = authForConnector(c);
  const ga = google.analyticsdata({ version: "v1beta", auth });
  const property = `properties/${c.remote_id}`;

  const totals = await ga.properties.runReport({
    property,
    requestBody: {
      dateRanges: [{ startDate: opts.startDate, endDate: opts.endDate }],
      metrics: [
        { name: "sessions" },
        { name: "totalUsers" },
        { name: "bounceRate" },
        { name: "averageSessionDuration" },
      ],
    },
  });

  const channelRes = await ga.properties.runReport({
    property,
    requestBody: {
      dateRanges: [{ startDate: opts.startDate, endDate: opts.endDate }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
      metrics: [{ name: "sessions" }],
    },
  });

  const t = totals.data.rows?.[0]?.metricValues ?? [];
  const channels: Record<string, number> = {};
  for (const r of channelRes.data.rows ?? []) {
    const name = (r.dimensionValues?.[0]?.value ?? "unknown").toLowerCase();
    const sessions = Number(r.metricValues?.[0]?.value ?? 0);
    channels[mapChannelName(name)] = (channels[mapChannelName(name)] ?? 0) + sessions;
  }

  return {
    sessions: Number(t[0]?.value ?? 0),
    users: Number(t[1]?.value ?? 0),
    bounceRate: Number(t[2]?.value ?? 0),
    avgSessionDurationSec: Math.round(Number(t[3]?.value ?? 0)),
    channels,
  };
}

function mapChannelName(name: string): string {
  if (name.includes("organic search")) return "organic";
  if (name.includes("paid search") || name.includes("paid social")) return "paid";
  if (name === "direct") return "direct";
  if (name.includes("organic social") || name.includes("social")) return "social";
  if (name.includes("referral")) return "referral";
  if (name.includes("email")) return "email";
  return "other";
}
