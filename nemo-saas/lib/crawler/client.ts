/**
 * Crawler client — wraps the Playwright worker (lifted from Nemo's browser
 * routes, run as its own service so the Next.js runtime stays slim).
 *
 * The worker speaks a tiny HTTP API:
 *   POST /snapshot     { url } -> { html, status, finalUrl }
 *   POST /accessibility { url } -> { tree }
 *   POST /screenshot   { url } -> { pngBase64 }
 *
 * For dev / tests without the worker running, the client falls back to a plain
 * fetch + cheerio snapshot so deterministic skills still function.
 */

import * as cheerio from "cheerio";

const CRAWLER_URL = process.env.NEMO_CRAWLER_URL ?? "";

export interface SnapshotResult {
  html: string;
  status: number;
  finalUrl: string;
  /** Source: 'crawler' if Playwright worker reachable, 'fetch' fallback otherwise. */
  source: "crawler" | "fetch";
}

export async function snapshot(url: string): Promise<SnapshotResult> {
  if (CRAWLER_URL) {
    try {
      const res = await fetch(`${CRAWLER_URL}/snapshot`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (res.ok) {
        const j = (await res.json()) as Omit<SnapshotResult, "source">;
        return { ...j, source: "crawler" };
      }
    } catch {
      // fall through to fetch fallback
    }
  }
  const res = await fetch(url, { redirect: "follow" });
  const html = await res.text();
  return { html, status: res.status, finalUrl: res.url, source: "fetch" };
}

export interface OnPageSummary {
  title: string | null;
  metaDescription: string | null;
  h1: string[];
  canonical: string | null;
  hasSchemaLocalBusiness: boolean;
  internalLinkCount: number;
  externalLinkCount: number;
  wordCount: number;
}

export function summarizeOnPage(html: string, baseUrl: string): OnPageSummary {
  const $ = cheerio.load(html);
  let internal = 0;
  let external = 0;
  const baseHost = safeHost(baseUrl);
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (!href || href.startsWith("#") || href.startsWith("mailto:")) return;
    const host = safeHost(href, baseUrl);
    if (host === baseHost) internal++;
    else external++;
  });

  let hasLocalBusiness = false;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).contents().text());
      if (matchesLocalBusiness(data)) hasLocalBusiness = true;
    } catch {
      // skip invalid json-ld
    }
  });

  const text = $("body").text().replace(/\s+/g, " ").trim();
  return {
    title: $("title").first().text() || null,
    metaDescription: $('meta[name="description"]').attr("content") ?? null,
    h1: $("h1").map((_, el) => $(el).text().trim()).get(),
    canonical: $('link[rel="canonical"]').attr("href") ?? null,
    hasSchemaLocalBusiness: hasLocalBusiness,
    internalLinkCount: internal,
    externalLinkCount: external,
    wordCount: text ? text.split(/\s+/).length : 0,
  };
}

function safeHost(url: string, base?: string): string {
  try {
    return new URL(url, base).host;
  } catch {
    return "";
  }
}

function matchesLocalBusiness(data: unknown): boolean {
  if (!data) return false;
  if (Array.isArray(data)) return data.some(matchesLocalBusiness);
  if (typeof data !== "object") return false;
  const t = (data as { "@type"?: unknown })["@type"];
  if (typeof t === "string") return /LocalBusiness|Organization|ProfessionalService/i.test(t);
  if (Array.isArray(t)) return t.some((x) => typeof x === "string" && /LocalBusiness|Organization|ProfessionalService/i.test(x));
  return false;
}
