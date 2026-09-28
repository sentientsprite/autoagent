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
  "/products/beacon", "/products/bloom", "/products/echo",
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
  // Homepage should declare lang=en
  const home = await fetch(BASE + "/", { redirect: "follow" });
  const homeHtml = await home.text();
  if (!/html[^>]+lang=["']en["']/i.test(homeHtml)) {
    console.log(`WARN\thtml-lang\tmissing lang=en on /`);
    fail = 1;
  } else {
    console.log(`OK\thtml-lang\tlang=en on /`);
  if (!homeHtml.includes("viewport")) {
    console.log(`WARN\tmissing-viewport\t/`);
    fail = 1;
  } else {
    console.log(`OK\tviewport\tpresent on /`);
  if (!/charset/i.test(homeHtml)) {
    console.log(`WARN\tmissing-charset\t/`);
    fail = 1;
  } else {
    console.log(`OK\tcharset\tpresent on /`);
  if (!homeHtml.includes("Organization") || !homeHtml.includes("WebSite")) {
    console.log(`WARN\thome-jsonld\tmissing Organization/WebSite`);
    fail = 1;
  } else {
    console.log(`OK\thome-jsonld\tOrganization+WebSite`);
  }

  }

  }

  }

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
      const faqQs = (text.match(/"@type":\s*"Question"/g) || []).length;
      if (faqQs < 2) {
        console.log(`WARN\tfaq-count\t${faqQs}\t${r}`);
        fail = 1;
      }
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
      // related section should not only self-link; need >=2 sibling guides
      const relSec = text.match(/More guides[\s\S]*?<\/ul>/i);
      if (relSec) {
        const hrefs = [...relSec[0].matchAll(/href=["']([^"']+)["']/g)].map((x) => x[1]);
        if (hrefs.length < 2) {
          console.log(`WARN\trelated-count\t${hrefs.length}\t${r}`);
          fail = 1;
        }
        if (hrefs.length > 0 && hrefs.every((h) => h === r)) {
          console.log(`WARN\trelated-self\t${r}`);
          fail = 1;
        }
      }
      if (!text.includes('rel="canonical"') && !text.includes("rel='canonical'")) {
        console.log(`WARN\tmissing-canonical\t${r}`);
        fail = 1;
      }
      if (!text.includes("twitter:card")) {
        console.log(`WARN\tmissing-twitter-card\t${r}`);
        fail = 1;
      }
      if (!text.includes("og:type")) {
        console.log(`WARN\tmissing-og-type\t${r}`);
        fail = 1;
      }
      if (!/<h1[\s>]/i.test(text)) {
        console.log(`WARN\tmissing-h1\t${r}`);
        fail = 1;
      }
      if (!/application\/ld\+json/i.test(text)) {
        console.log(`WARN\tmissing-ldjson\t${r}`);
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


// Related-guide hrefs on sample articles must 200
const RELATED_SAMPLES = [
  "/ut/salt-lake-city/plumber-google-maps-visibility",
  "/id/boise/concrete-sealing-google-maps",
  "/ut/ogden/roofer-google-review-replies",
];
for (const r of RELATED_SAMPLES) {
  try {
    const res = await fetch(BASE + r, { redirect: "follow" });
    const text = await res.text();
    const section = text.match(/More guides[\s\S]*?<\/ul>/i);
    const hrefs = section
      ? [...section[0].matchAll(/href=["']([^"']+)["']/g)].map((x) => x[1])
      : [];
    const uniq = [...new Set(hrefs)].filter((h) => h.startsWith("/"));
    if (uniq.length === 0) {
      console.log(`WARN\trelated-href-empty\t${r}`);
      fail = 1;
    }
    for (const h of uniq) {
      const rr = await fetch(BASE + h, { redirect: "follow" });
      if (rr.status !== 200) {
        console.log(`WARN\trelated-href\t${rr.status}\t${h}\tfrom ${r}`);
        fail = 1;
      }
    }
    console.log(`OK\trelated-hrefs\t${uniq.length}\tfrom ${r}`);
  } catch (e) {
    fail = 1;
    console.log(`ERR\trelated-href\t${r}\t${e.message}`);
  }
}


// robots.txt must disallow private prefixes
try {
  const res = await fetch(BASE + "/robots.txt", { redirect: "follow" });
  const txt = await res.text();
  let robotsOk = true;
  for (const d of ["Disallow: /api/", "Disallow: /team", "Disallow: /hq/", "Disallow: /billing/"]) {
    if (!txt.includes(d)) {
      console.log(`WARN\trobots-disallow\tmissing ${d}`);
      fail = 1;
      robotsOk = false;
    }
  }
  if (!/Sitemap:\s*https?:\/\//i.test(txt)) {
    console.log(`WARN\trobots-sitemap\tmissing Sitemap line`);
    fail = 1;
    robotsOk = false;
  }
  if (robotsOk) console.log(`OK\trobots-disallow\tapi/team/hq/billing + Sitemap`);
} catch (e) {
  fail = 1;
  console.log(`ERR\trobots-disallow\t${e.message}`);
}


// security.txt must be plain text
try {
  const res = await fetch(BASE + "/.well-known/security.txt", { redirect: "follow" });
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  const body = await res.text();
  if (!ct.includes("text/plain")) {
    console.log(`WARN\tsecurity-ctype\t${ct || "(absent)"}`);
    fail = 1;
  } else if (!body.includes("Contact:") || !body.includes("Expires:")) {
    console.log(`WARN\tsecurity-body\tmissing Contact/Expires`);
    fail = 1;
  } else {
    console.log(`OK\tsecurity-ctype\ttext/plain + Contact/Expires`);
  }
} catch (e) {
  fail = 1;
  console.log(`ERR\tsecurity-ctype\t${e.message}`);
}


// product pages should carry og:title
for (const r of ["/products/beacon", "/products/bloom", "/products/echo"]) {
  try {
    const res = await fetch(BASE + r, { redirect: "follow" });
    const text = await res.text();
    const robotsNoindex = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(text)
      || /<meta[^>]+content=["'][^"']*noindex[^"']*["'][^>]+name=["']robots["']/i.test(text);
    if (res.status !== 200 || !text.includes("og:title") || robotsNoindex) {
      console.log(`WARN\tproduct-og\t${res.status}\tog=${text.includes("og:title")}\tnoindex=${robotsNoindex}\t${r}`);
      fail = 1;
    } else {
      console.log(`OK\tproduct-og\t${r}`);
    }
  } catch (e) {
    fail = 1;
    console.log(`ERR\tproduct-og\t${r}\t${e.message}`);
  }
}


// sitemap must list all public marketing paths
try {
  const res = await fetch(BASE + "/sitemap.xml", { redirect: "follow" });
  const xml = await res.text();
  if (!xml.includes("<urlset") && !xml.includes("<urlset ")) {
    console.log(`WARN\tsitemap-urlset\tmissing urlset`);
    fail = 1;
  }
  const required = [
    "/", "/portal", "/ut", "/id",
    "/products/beacon", "/products/bloom", "/products/echo",
    "/ut/provo/hvac-ai-seo-vs-google-maps",
    "/id/boise/concrete-sealing-google-maps",
    "/ut/salt-lake-city/plumber-google-maps-visibility",
    "/ut/ogden/roofer-google-review-replies",
  ];
  let miss = 0;
  for (const path of required) {
    const needle = path === "/" ? `${BASE}/</loc>` : `${BASE}${path}</loc>`;
    // also accept without trailing issues
    if (!xml.includes(`${BASE}${path}</loc>`) && !(path === "/" && xml.includes(`${BASE}/</loc>`))) {
      // homepage loc may be BASE or BASE/
      if (path === "/") {
        if (!(xml.includes(`<loc>${BASE}</loc>`) || xml.includes(`<loc>${BASE}/</loc>`))) {
          console.log(`WARN\tsitemap-missing\t/`);
          miss++;
        }
      } else {
        console.log(`WARN\tsitemap-missing\t${path}`);
        miss++;
      }
    }
  }
  if (miss) fail = 1;
  else console.log(`OK\tsitemap-urlset\trequired locs present`);
} catch (e) {
  fail = 1;
  console.log(`ERR\tsitemap-urlset\t${e.message}`);
}


// llms.txt should index Guides
try {
  const res = await fetch(BASE + "/llms.txt", { redirect: "follow" });
  const txt = await res.text();
  if (!txt.includes("## Guides") || !txt.includes("/ut/salt-lake-city/plumber-google-maps-visibility")) {
    console.log(`WARN\tllms-guides\tmissing Guides index`);
    fail = 1;
  } else {
    console.log(`OK\tllms-guides\tGuides section present`);
  }
} catch (e) {
  fail = 1;
  console.log(`ERR\tllms-guides\t${e.message}`);
}


// portal should mention Local Visibility Score CTA language
try {
  const res = await fetch(BASE + "/portal", { redirect: "follow" });
  const text = await res.text();
  if (!/Local Visibility Score/i.test(text)) {
    console.log(`WARN\tportal-cta\tmissing LVS copy`);
    fail = 1;
  } else {
    console.log(`OK\tportal-cta\tLVS copy present`);
  }
} catch (e) {
  fail = 1;
  console.log(`ERR\tportal-cta\t${e.message}`);
}


// state hubs should expose an h1
for (const r of ["/ut", "/id"]) {
  try {
    const res = await fetch(BASE + r, { redirect: "follow" });
    const text = await res.text();
    if (res.status !== 200 || !/<h1[\s>]/i.test(text)) {
      console.log(`WARN\thub-h1\t${res.status}\t${r}`);
      fail = 1;
    } else {
      console.log(`OK\thub-h1\t${r}`);
    }
  } catch (e) {
    fail = 1;
    console.log(`ERR\thub-h1\t${r}\t${e.message}`);
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
