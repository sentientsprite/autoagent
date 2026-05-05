import { z } from "zod";

const CrawlEnvelopeSchema = z
  .object({
    ok: z.boolean().optional(),
    error: z.string().optional(),
    data: z.unknown().optional(),
  })
  .passthrough();

const CrawlBlobSchema = z
  .object({
    url: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    markdown: z.string().optional(),
    html: z.string().optional(),
    text: z.string().optional(),
    links: z.array(z.string()).optional(),
    lighthouse: z.record(z.unknown()).optional(),
  })
  .passthrough();

export type PinchTabCrawl = z.infer<typeof CrawlBlobSchema> & { source: string };

function extractBlob(json: unknown): unknown {
  if (!json || typeof json !== "object") return json;
  const rec = json as Record<string, unknown>;

  const payload =
    typeof rec.payload === "object" && rec.payload ? rec.payload : undefined;
  const inner =
    payload && typeof (payload as { result?: unknown }).result !== "undefined"
      ? (payload as { result: unknown }).result
      : payload;

  if (inner !== undefined) return inner;
  if (typeof rec.result !== "undefined") return rec.result;
  if (typeof rec.data !== "undefined") return rec.data;

  return json;
}

/**
 * Calls PinchTab with a forgiving contract: POST `{ url }` to `/crawl` by default.
 * Override with PINCHTAB_CRAWL_PATH (e.g. `/api/crawl`).
 */
export async function fetchPinchTabCrawl(
  url: string,
  timeoutMs: number,
): Promise<PinchTabCrawl | null> {
  const base = (
    process.env.PINCHTAB_BASE_URL?.trim() || "http://127.0.0.1:9867"
  ).replace(/\/$/, "");
  let crawlPath = process.env.PINCHTAB_CRAWL_PATH?.trim() || "/crawl";
  if (!crawlPath.startsWith("/")) crawlPath = `/${crawlPath}`;
  const target = `${base}${crawlPath}`;
  try {
    const res = await fetch(target, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) return null;

    const jsonUnknown: unknown = await res.json().catch(() => null);
    if (!jsonUnknown) return null;

    const decoded = CrawlEnvelopeSchema.safeParse(jsonUnknown);
    let candidate: unknown = jsonUnknown;

    if (decoded.success && decoded.data.data !== undefined) {
      candidate = decoded.data.data;
    }

    candidate = extractBlob(candidate);
    const inner = CrawlBlobSchema.safeParse(candidate);
    if (!inner.success) {
      const maybeData = CrawlEnvelopeSchema.safeParse(jsonUnknown);
      if (
        maybeData.success &&
        maybeData.data.data &&
        CrawlBlobSchema.safeParse(extractBlob(maybeData.data.data)).success
      ) {
        return {
          ...CrawlBlobSchema.parse(extractBlob(maybeData.data.data)),
          source: target,
        };
      }

      const textSnippet =
        typeof jsonUnknown === "string"
          ? jsonUnknown
          : JSON.stringify(jsonUnknown).slice(0, 2500);

      return {
        source: target,
        text: textSnippet,
      };
    }

    return { ...inner.data, source: target };
  } catch {
    return null;
  }
}
