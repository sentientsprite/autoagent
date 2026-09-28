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

const REQUIRED_HEADERS = [
  ["x-content-type-options", "nosniff"],
  ["x-frame-options", "DENY"],
  ["referrer-policy", "strict-origin-when-cross-origin"],
];

let fail = 0;

// Security header check on marketing hub (once)
try {
  const href = BASE + "/ut";
  const headRes = await fetch(href, { method: "GET", redirect: "follow" });
  for (const [name, expected] of REQUIRED_HEADERS) {
    const got = (headRes.headers.get(name) || "").toLowerCase();
    if (!got.includes(expected.toLowerCase())) {
      console.log(`WARN\tmissing-header\t${name}=${got || "(absent)"}\texpected~${expected}`);
      fail = 1;
    }
  }
  const pp = headRes.headers.get("permissions-policy") || "";
  if (!pp.includes("camera=") || !pp.includes("microphone=")) {
    console.log(`WARN\tmissing-header\tpermissions-policy=${pp || "(absent)"}`);
    fail = 1;
  } else {
    console.log(`OK\theaders\tnosniff/DENY/referrer/permissions on /ut`);
  }
} catch (e) {
  fail = 1;
  console.log(`ERR\theaders\t${e.message}`);
}

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
      const robotsNoindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(text)
        || /<meta[^>]+content=["'][^"']*noindex[^"']*["'][^>]+name=["']robots["']/i.test(text);
      if (robotsNoindex) {
        console.log(`WARN\tnoindex-on-article\t${r}`);
        fail = 1;
      }
    }
    if (res.status !== 200) fail = 1;
    let og = "n/a";
    if (depth >= 3 && (r.startsWith("/ut/") || r.startsWith("/id/"))) {
      og = text.includes("og:title") ? "yes" : "NO";
      if (og === "NO") fail = 1;
      if (!text.includes("More guides")) {
        console.log(`WARN\tmissing-related\t${r}`);
        fail = 1;
      }
      if (!text.includes('rel="canonical"') && !text.includes("rel='canonical'")) {
        console.log(`WARN\tmissing-canonical\t${r}`);
        fail = 1;
      }
      if (!text.includes("twitter:card")) {
        console.log(`WARN\tmissing-twitter-card\t${r}`);
        fail = 1;
      }
      if (!text.includes("BreadcrumbList")) {
        console.log(`WARN\tmissing-breadcrumb\t${r}`);
        fail = 1;
      }
      if (!text.includes('"@type":"Article"') && !text.includes("'@type':'Article'") && !text.includes('"@type": "Article"')) {
        console.log(`WARN\tmissing-article-jsonld\t${r}`);
        fail = 1;
      }
    }
    console.log(`${res.status}\tFAQ=${faq}\tOG=${og}\t${r}`);
  } catch (e) {
    fail = 1;
    console.log(`ERR\tFAQ=n/a\t${r}\t${e.message}`);
  }
}

// Private routes must stay noindex (belt-and-suspenders with robots.txt)
const PRIVATE = ["/team", "/billing/success", "/hq/locations"];
for (const r of PRIVATE) {
  try {
    const res = await fetch(BASE + r, { redirect: "follow" });
    const text = await res.text();
    if (res.status !== 200) {
      console.log(`WARN\tprivate-status\t${res.status}\t${r}`);
      fail = 1;
    }
    const robotsNoindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(text)
      || /<meta[^>]+content=["'][^"']*noindex[^"']*["'][^>]+name=["']robots["']/i.test(text);
    if (!robotsNoindex) {
      console.log(`WARN\tprivate-missing-noindex\t${r}`);
      fail = 1;
    } else {
      console.log(`${res.status}\tnoindex=yes\t${r}`);
    }
  } catch (e) {
    fail = 1;
    console.log(`ERR\tprivate\t${r}\t${e.message}`);
  }
}

process.exit(fail ? 1 : 0);
