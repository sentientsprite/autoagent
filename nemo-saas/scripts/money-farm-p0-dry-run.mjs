#!/usr/bin/env node
/**
 * Money Farm P0 dry-run (no live Stripe / Places / Resend / Serper).
 *
 * 1) Loads fixtures/money-farm/org-two-locations.json (≥2 locations)
 * 2) Builds deterministic LVS-shaped findings from places_mock
 * 3) Writes stub PDF + email HTML under .tmp/money-farm/
 *
 * For the full TS orchestrator (react-pdf when available), also run:
 *   npx vitest run lib/money-farm/run-location-report.test.ts
 *
 * LIVE Stripe = Owner GATE.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const fixturePath = path.join(root, "fixtures/money-farm/org-two-locations.json");
const outDir = path.join(root, ".tmp/money-farm");

const fixture = JSON.parse(readFileSync(fixturePath, "utf8"));
if (!fixture.sites || fixture.sites.length < 2) {
  console.error("FAIL: fixture must include ≥2 sites");
  process.exit(1);
}

mkdirSync(outDir, { recursive: true });

function stubPdf(label) {
  const safe = String(label).replace(/[^\w .-]/g, "").slice(0, 60) || "report";
  return Buffer.from(
    `%PDF-1.1
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj
4 0 obj<< /Length 64 >>stream
BT /F1 16 Tf 72 720 Td (${safe}) Tj ET
endstream endobj
5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000384 00000 n 
trailer<< /Size 6 /Root 1 0 R >>
startxref
463
%%EOF
`,
    "utf8",
  );
}

const results = [];
for (const site of fixture.sites) {
  const place = fixture.places_mock?.[site.id];
  const businessName = site.business_name || site.name;
  const city = site.city || "Local";
  const photoCount = place?.photoCount ?? 0;
  const insights = [];
  if (photoCount < 10) {
    insights.push({
      id: "gbp.thin_photos",
      severity: "warning",
      title: "Too few photos on your GBP",
      message: `Only ${photoCount} photos (fixture mock).`,
    });
  }
  if ((place?.userRatingsTotal ?? 0) < 50) {
    insights.push({
      id: "gbp.review_count",
      severity: "info",
      title: "Build more reviews",
      message: `${place?.userRatingsTotal ?? 0} reviews on fixture listing.`,
    });
  }
  insights.push({
    id: "gbp.found",
    severity: "win",
    title: "Fixture Places listing matched",
    message: `Mock placeId ${place?.placeId ?? "none"} — no live Places call.`,
  });

  let score = 100;
  for (const i of insights) {
    if (i.severity === "warning") score -= 10;
    else if (i.severity === "info") score -= 3;
    else if (i.severity === "win") score += 5;
  }
  score = Math.max(0, Math.min(100, score));
  const grade = score >= 90 ? "A" : score >= 80 ? "B" : score >= 65 ? "C" : score >= 50 ? "D" : "F";

  const slug = `${site.id.slice(0, 8)}_${String(city).toLowerCase()}`;
  const pdfPath = path.join(outDir, `${slug}.pdf`);
  const emailPath = path.join(outDir, `${slug}.email.html`);
  const pdf = stubPdf(`${businessName} ${grade}`);
  writeFileSync(pdfPath, pdf);
  writeFileSync(
    emailPath,
    `<!DOCTYPE html><html><body>
<h1>${businessName} — LVS ${grade} (${score})</h1>
<p>Money Farm P0 dry-run stub. RESEND unset → file only. No live Stripe.</p>
<p>City: ${city}. PDF: ${pdfPath}</p>
<ul>${insights.map((i) => `<li>[${i.severity}] ${i.title}</li>`).join("")}</ul>
</body></html>`,
    "utf8",
  );

  results.push({
    siteId: site.id,
    businessName,
    city,
    grade,
    score,
    pdfPath,
    emailPath,
    pdfBytes: pdf.byteLength,
    mode: "fixture_places_stub",
  });
}

const summaryPath = path.join(outDir, "dry-run-summary.json");
writeFileSync(
  summaryPath,
  JSON.stringify(
    {
      orgId: fixture.org.id,
      orgName: fixture.org.name,
      siteCount: fixture.sites.length,
      stripe: "mock (STRIPE_SECRET_KEY unset assumed)",
      liveStripeGate: "Owner GATE",
      results,
    },
    null,
    2,
  ),
  "utf8",
);

console.log(
  JSON.stringify(
    {
      ok: true,
      orgId: fixture.org.id,
      locations: fixture.sites.length,
      outDir,
      summaryPath,
      results: results.map((r) => ({
        siteId: r.siteId,
        city: r.city,
        grade: r.grade,
        score: r.score,
        pdfBytes: r.pdfBytes,
      })),
    },
    null,
    2,
  ),
);
