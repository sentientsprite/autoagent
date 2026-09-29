/** Public marketing URLs for sitemap + regression tests. */
export const PUBLIC_BASE = "https://nemo-app-v-1.vercel.app";

export const PUBLIC_HUB_PATHS = ["/", "/portal", "/products/beacon", "/products/bloom", "/products/echo", "/ut", "/id"] as const;

export const PUBLIC_ARTICLE_PATHS = [
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

export const PUBLIC_SITEMAP_PATHS = [...PUBLIC_HUB_PATHS, ...PUBLIC_ARTICLE_PATHS] as const;
