import type { MetadataRoute } from "next";

const BASE = "https://nemo-app-v-1.vercel.app";

/** Public marketing + product URLs only — exclude /team (noindex), /hq, /api, billing. */
const PATHS = [
  "/",
  "/portal",
  "/products/beacon",
  "/products/bloom",
  "/products/echo",
  "/ut",
  "/id",
  "/ut/provo/hvac-ai-seo-vs-google-maps",
  "/id/boise/concrete-sealing-google-maps",
  "/ut/salt-lake-city/electrician-gbp-website-link",
  "/ut/salt-lake-city/plumber-google-maps-visibility",
  "/ut/salt-lake-city/roofer-google-review-velocity",
  "/ut/salt-lake-city/electrician-ppc-seo-same-landing",
  "/ut/salt-lake-city/contractor-nap-mismatch-citations",
  "/ut/orem/hvac-google-maps-visibility",
  "/ut/salt-lake-city/service-area-gbp-too-vague",
  "/ut/ogden/roofer-google-review-replies",
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-09-28T00:00:00-06:00");
  return PATHS.map((path) => ({
    url: `${BASE}${path}`,
    lastModified,
    changeFrequency: path === "/" || path === "/portal" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path.startsWith("/ut/") || path.startsWith("/id/") ? 0.8 : 0.6,
  }));
}
