export function normalizeUrl(input: string): string {
  const t = input.trim();
  if (!t) throw new Error("URL is empty");
  if (/^javascript:/i.test(t)) throw new Error("Invalid URL");

  const withScheme = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  const url = new URL(withScheme);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only http(s) URLs are allowed");
  }
  return url.toString();
}
