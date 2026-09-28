#!/usr/bin/env node
/**
 * Production smoke for Nemo marketing alias.
 * Usage: node scripts/prod-smoke.mjs [baseUrl]
 */
const BASE = process.argv[2] || "https://nemo-app-v-1.vercel.app";
const ROUTES = [
  "/", "/portal", "/ut", "/id",
  "/robots.txt", "/sitemap.xml", "/llms.txt", "/humans.txt",
  "/site.webmanifest", "/.well-known/security.txt",
  "/ut/provo/hvac-ai-seo-vs-google-maps",
  "/id/boise/concrete-sealing-google-maps",
  "/ut/salt-lake-city/plumber-google-maps-visibility",
  "/ut/salt-lake-city/electrician-gbp-website-link",
  "/ut/salt-lake-city/electrician-ppc-seo-same-landing",
  "/ut/salt-lake-city/roofer-google-review-velocity",
  "/ut/salt-lake-city/contractor-nap-mismatch-citations",
  "/ut/orem/hvac-google-maps-visibility",
  "/ut/salt-lake-city/service-area-gbp-too-vague",
  "/ut/ogden/roofer-google-review-replies",
];

let fail = 0;
for (const r of ROUTES) {
  const url = BASE + r;
  try {
    const res = await fetch(url, { redirect: "follow" });
    const text = await res.text();
    const depth = r.split("/").filter(Boolean).length;
    let faq = "n/a";
    if (depth >= 3 && (r.startsWith("/ut/") || r.startsWith("/id/"))) {
      faq = text.includes("FAQPage") ? "yes" : "NO";
      if (faq === "NO") fail = 1;
      // indexable articles must not carry robots noindex
      if (text.includes("name=\"robots\"") && text.includes("noindex") && !text.includes("name=\"robots\" content=\"index")) {
        // Next may emit noindex on error pages only; flag if FAQ present AND noindex in head meta robots
      }
      const robotsNoindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(text)
        || /<meta[^>]+content=["'][^"']*noindex[^"']*["'][^>]+name=["']robots["']/i.test(text);
      if (robotsNoindex) {
        console.log(`WARN\tnoindex-on-article\t${r}`);
        fail = 1;
      }
    }
    if (res.status !== 200) fail = 1;
    console.log(`${res.status}\tFAQ=${faq}\t${r}`);
  } catch (e) {
    fail = 1;
    console.log(`ERR\tFAQ=n/a\t${r}\t${e.message}`);
  }
}
process.exit(fail ? 1 : 0);
