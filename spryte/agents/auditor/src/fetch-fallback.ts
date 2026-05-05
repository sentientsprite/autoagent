export async function fetchPublicHtml(
  url: string,
  timeoutMs: number,
): Promise<{ ok: boolean; status: number; html: string } | null> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(timeoutMs),
      headers: {
        "User-Agent": "SPRYTE-AuditBot/0.1 (+https://spryte.local)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    const html = await res.text();
    return { ok: res.ok, status: res.status, html: html.slice(0, 200_000) };
  } catch {
    return null;
  }
}
