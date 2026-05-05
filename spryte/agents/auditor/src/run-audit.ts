import { completeWithFallback, type StructuredLogger } from "@spryte/llm";

import { fetchPublicHtml } from "./fetch-fallback.js";
import { fetchPinchTabCrawl } from "./pinchtab.js";
import { extractJsonObject } from "./json-extract.js";
import type { AuditScores, FreeAuditInput, FreeAuditResult } from "./scores.js";
import { AuditScoresSchema, FreeAuditResultSchema } from "./scores.js";
import { normalizeUrl } from "./url.js";

function defaultLog(entry: Parameters<StructuredLogger>[0]): void {
  console.log(JSON.stringify(entry));
}

function heuristicScores(input: {
  html?: string | null;
  title?: string | null;
  description?: string | null;
  text?: string | null;
  linksCount?: number;
}): AuditScores {
  const blob = `${input.title ?? ""}\n${input.description ?? ""}\n${input.text ?? ""}\n${input.html ?? ""}`.slice(
    0,
    50_000,
  );
  const len = blob.length;

  const hasViewport = /<meta\s+name=["']viewport["']/i.test(blob);
  const hasOg = /<meta\s+property=["']og:/i.test(blob);
  const hasSchema = /application\/ld\+json/i.test(blob);
  const hasReviews = /review|rating|stars|google/i.test(blob);

  const seo = Math.min(10, Math.max(2, Math.round((hasOg ? 3 : 1) + (hasSchema ? 3 : 1) + (len > 4000 ? 3 : 2))));
  const mobile = Math.min(10, Math.max(2, hasViewport ? 7 : 4));
  const content = Math.min(10, Math.max(2, len > 8000 ? 8 : len > 3000 ? 6 : 4));
  const gbp = 4;
  const reviews = Math.min(10, Math.max(2, hasReviews ? 5 : 3));

  return AuditScoresSchema.parse({
    gbp,
    seo,
    mobile,
    content,
    reviews,
    headline: "Heuristic preview (LLM unavailable or failed JSON).",
    highlights: [
      hasViewport ? "Viewport meta present (mobile baseline)." : "No obvious viewport meta — mobile UX risk.",
      hasOg ? "Open Graph tags detected." : "Limited social/meta signals in HTML.",
      hasSchema ? "Structured data hints found." : "No obvious JSON-LD detected.",
    ],
    actions: [
      "Claim and complete your Google Business Profile with photos + services.",
      "Add unique service-area pages for each primary city you serve.",
    ],
  });
}

function buildPrompt(input: {
  normalizedUrl: string;
  city?: string;
  businessName?: string;
  crawlSummary: string;
}): { system: string; user: string } {
  const system = [
    "You are SPRYTE's lead auditor for local SMB digital presence in Utah (especially Salt Lake County).",
    "You receive crawl-derived evidence (HTML/Markdown/text snippets).",
    "Score each category from 0-10 with tough but fair local SEO standards.",
    "Return ONLY a JSON object with keys: gbp, seo, mobile, content, reviews, headline, highlights, actions.",
    "- gbp: Google Business Profile strength signals inferable from public web evidence (NAP consistency hints, schema, links to maps, etc.).",
    "- seo: on-page SEO, IA, internal links, metadata, indexability signals visible in the snippet.",
    "- mobile: responsive signals, performance hints, tap targets (infer cautiously from markup).",
    "- content: usefulness, differentiation, local relevance, depth.",
    "- reviews: reputation signals visible on the site (testimonials, schema, third-party embeds).",
    "headline: 1 sentence executive summary for the owner.",
    "highlights: 3-6 bullet strings (no leading dashes in JSON strings).",
    "actions: 3-6 highest ROI next steps.",
    "Do not include markdown fences. Do not include commentary outside JSON.",
  ].join(" ");

  const user = [
    `Business URL: ${input.normalizedUrl}`,
    input.city ? `City context: ${input.city}` : undefined,
    input.businessName ? `Business name: ${input.businessName}` : undefined,
    "",
    "Evidence (may be partial):",
    input.crawlSummary.slice(0, 18_000),
  ]
    .filter(Boolean)
    .join("\n");

  return { system, user };
}

export async function runFreeAudit(params: {
  input: FreeAuditInput;
  /** Entire audit budget (PinchTab + fetch + LLM). */
  budgetMs: number;
  log?: StructuredLogger;
}): Promise<FreeAuditResult> {
  const log = params.log ?? defaultLog;
  const normalizedUrl = normalizeUrl(params.input.url);

  const t0 = Date.now();

  const pinchTimeout = Math.min(8000, Math.max(2500, Math.floor(params.budgetMs * 0.35)));
  const fetchTimeout = Math.min(8000, Math.max(2500, Math.floor(params.budgetMs * 0.25)));

  const pinchTab = await fetchPinchTabCrawl(normalizedUrl, pinchTimeout);
  const fetched =
    pinchTab?.html || pinchTab?.markdown || pinchTab?.text
      ? null
      : await fetchPublicHtml(normalizedUrl, fetchTimeout);

  const usedPinchTab = Boolean(pinchTab && (pinchTab.html || pinchTab.markdown || pinchTab.text || pinchTab.title));
  const usedDirectFetch = Boolean(fetched?.ok && fetched.html.length > 200);

  const crawlSummaryParts: string[] = [];
  crawlSummaryParts.push(`pinchtab_connected=${usedPinchTab}`);
  if (pinchTab?.title) crawlSummaryParts.push(`title=${pinchTab.title}`);
  if (pinchTab?.description) crawlSummaryParts.push(`meta_description=${pinchTab.description}`);
  if (pinchTab?.markdown) crawlSummaryParts.push(`MARKDOWN:\n${pinchTab.markdown.slice(0, 12_000)}`);
  if (pinchTab?.text) crawlSummaryParts.push(`TEXT:\n${pinchTab.text.slice(0, 12_000)}`);
  if (pinchTab?.html) crawlSummaryParts.push(`HTML_SNIPPET:\n${pinchTab.html.slice(0, 12_000)}`);
  if (!usedPinchTab && fetched?.html) {
    crawlSummaryParts.push(`DIRECT_HTML_STATUS=${fetched.status}`);
    crawlSummaryParts.push(`HTML_SNIPPET:\n${fetched.html.slice(0, 12_000)}`);
  }
  const crawlSummary = crawlSummaryParts.join("\n");

  const remaining = Math.max(2500, params.budgetMs - (Date.now() - t0));
  const llmTimeout = Math.min(remaining, Math.max(5000, Math.floor(params.budgetMs * 0.55)));

  const prompt = buildPrompt({
    normalizedUrl,
    city: params.input.city,
    businessName: params.input.businessName,
    crawlSummary,
  });

  let scores: AuditScores;
  let provider: "anthropic" | "mlx" = "mlx";
  let latencyMs = 0;
  let estimatedCostUsd = 0;

  try {
    const completion = await completeWithFallback(
      {
        system: prompt.system,
        messages: [{ role: "user", content: prompt.user }],
        timeoutMs: llmTimeout,
        maxOutputTokens: 900,
        temperature: 0.25,
      },
      log,
    );

    provider = completion.provider;
    latencyMs += completion.latencyMs;
    estimatedCostUsd += completion.usage.estimatedCostUsd;

    const parsed = extractJsonObject(completion.text);
    scores = AuditScoresSchema.parse(parsed);
  } catch (e) {
    log({
      timestamp: new Date().toISOString(),
      level: "warn",
      event: "auditor.llm_fallback_heuristic",
      error: typeof e === "object" && e && "message" in e ? String(e.message) : String(e),
    });

    scores = heuristicScores({
      html: pinchTab?.html ?? fetched?.html,
      title: pinchTab?.title,
      description: pinchTab?.description,
      text: pinchTab?.text,
      linksCount: pinchTab?.links?.length,
    });

    latencyMs += Math.max(0, Date.now() - t0);
    estimatedCostUsd = 0;
    provider = "mlx";
  }

  const result = FreeAuditResultSchema.parse({
    url: normalizedUrl,
    city: params.input.city,
    businessName: params.input.businessName,
    scores,
    evidence: {
      pinchTab: usedPinchTab,
      directFetch: usedDirectFetch,
      notes: [
        !usedPinchTab ? "PinchTab did not return usable content — verify PINCHTAB_BASE_URL and crawl path." : undefined,
        !usedPinchTab && !usedDirectFetch ? "Neither PinchTab nor direct fetch yielded HTML — scores may be coarse." : undefined,
      ].filter(Boolean) as string[],
    },
    model: { provider, latencyMs, estimatedCostUsd },
  });

  return result;
}
