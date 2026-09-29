/**
 * Money Farm P0 — location → LVS → PDF → email (test-mode orchestrator).
 *
 * When GOOGLE_MAPS_API_KEY / RESEND are unset:
 *   - Uses fixtures/money-farm places_mock (never calls Places)
 *   - Writes PDF + HTML under .tmp/money-farm/ instead of sending email
 *
 * LIVE Stripe / Places / Resend = Owner GATE. Dry-run safe.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { gbpInsights, napInsights, type Insight } from "@/lib/skills/_shared/rule-engine";
import {
  placeToGbpProfile,
  isPlacesConfigured,
  type PlaceResult,
} from "@/lib/connectors/places";
import {
  runDeterministic,
  type DeterministicOutput,
  type NarrativeOutput,
} from "@/lib/skills/local_visibility_audit";
import { renderLvsReportPdf } from "@/lib/pdf/lvs-report";

export interface MoneyFarmSiteFixture {
  id: string;
  org_id: string;
  name: string;
  website_url?: string | null;
  business_name?: string | null;
  city?: string | null;
  region?: string | null;
  postal_code?: string | null;
  primary_category?: string | null;
  service_area_zips?: string[] | null;
  phone?: string | null;
  street_address?: string | null;
}

export interface MoneyFarmOrgFixture {
  org: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    stripe_customer_id?: string | null;
  };
  sites: MoneyFarmSiteFixture[];
  places_mock?: Record<string, PlaceResult>;
}

export interface RunLocationReportArgs {
  orgId?: string;
  siteId?: string;
  fixturePath?: string;
  outDir?: string;
  /** Force fixture Places even if GOOGLE_MAPS_API_KEY is set. */
  forceFixturePlaces?: boolean;
}

export interface RunLocationReportResult {
  orgId: string;
  siteId: string;
  businessName: string;
  mode: "fixture_places" | "live_places" | "unconfigured_places";
  deterministic: DeterministicOutput;
  narrative?: NarrativeOutput;
  pdfPath: string;
  emailPath: string;
  emailSent: boolean;
  pdfBytes: number;
}

function repoRoot(): string {
  return process.cwd();
}

export function defaultFixturePath(): string {
  return path.join(repoRoot(), "fixtures/money-farm/org-two-locations.json");
}

export function loadMoneyFarmFixture(fixturePath?: string): MoneyFarmOrgFixture {
  const fp = fixturePath ?? defaultFixturePath();
  return JSON.parse(readFileSync(fp, "utf8")) as MoneyFarmOrgFixture;
}

function scoreFromInsights(insights: Insight[]): number {
  const weight: Record<Insight["severity"], number> = {
    critical: 25,
    warning: 10,
    info: 3,
    win: -5,
  };
  const penalty = insights.reduce((s, i) => s + weight[i.severity], 0);
  return Math.max(0, Math.min(100, 100 - penalty));
}

function gradeFromScore(score: number): DeterministicOutput["grade"] {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 65) return "C";
  if (score >= 50) return "D";
  return "F";
}

/** Deterministic LVS from fixture Places mock — no network. */
export function runDeterministicFromFixturePlace(args: {
  site: MoneyFarmSiteFixture;
  place: PlaceResult;
}): DeterministicOutput {
  const { site, place } = args;
  const expectedZips = site.service_area_zips?.length ?? 0;
  const gbp = placeToGbpProfile(place, expectedZips);
  const insights: Insight[] = [...gbpInsights(gbp)];

  if (site.street_address && place.phone) {
    insights.push(
      ...napInsights({
        truth: {
          name: site.business_name ?? site.name,
          address: site.street_address,
          phone: site.phone ?? place.phone ?? "",
        },
        records: [
          {
            source: "fixture_yelp",
            name: place.name,
            address: place.formattedAddress,
            phone: place.phone ?? null,
          },
        ],
      }),
    );
  }

  const score = scoreFromInsights(insights);
  return {
    grade: gradeFromScore(score),
    score,
    insights,
    evidence: {
      placeFound: true,
      placesLookupConfigured: false,
      placeId: place.placeId,
      rating: place.rating,
      reviewCount: place.userRatingsTotal,
      photoCount: place.photoCount,
      napDirectoriesChecked: 1,
      localCity: site.city ?? undefined,
    },
  };
}

function stubNarrative(d: DeterministicOutput, businessName: string): NarrativeOutput {
  const topFixes = d.insights
    .filter((i) => i.severity === "critical" || i.severity === "warning")
    .slice(0, 3)
    .map((i) => ({
      insightId: i.id,
      title: i.title,
      why: i.message,
      do_this: i.action,
    }));
  return {
    headline: `${businessName}: Local Visibility ${d.grade}`,
    summary: `Score ${d.score}/100 from Money Farm P0 dry-run (fixture/mock path).`,
    topFixes,
  };
}

export function stubPdfBuffer(label: string): Buffer {
  const safe = label.replace(/[^\w .-]/g, "").slice(0, 60) || "report";
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

function stubEmailHtml(args: {
  businessName: string;
  grade: string;
  score: number;
  pdfPath: string;
  topFix?: string;
}): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>LVS ${args.grade}</title></head>
<body style="font-family:system-ui,sans-serif;max-width:560px;margin:24px auto">
  <p style="color:#666;text-transform:uppercase;font-size:12px">Nemo Local · Money Farm P0 stub</p>
  <h1>${args.businessName} — Local Visibility Score: ${args.grade}</h1>
  <p>Score ${args.score}/100. RESEND unset — this file is the email stub (not sent).</p>
  ${args.topFix ? `<p><strong>Top fix:</strong> ${args.topFix}</p>` : ""}
  <p>PDF: <code>${args.pdfPath}</code></p>
</body></html>
`;
}

export async function runLocationReport(
  args: RunLocationReportArgs = {},
): Promise<RunLocationReportResult> {
  const fixture = loadMoneyFarmFixture(args.fixturePath);
  const site =
    (args.siteId ? fixture.sites.find((s) => s.id === args.siteId) : undefined) ??
    fixture.sites[0];
  if (!site) throw new Error("money_farm_site_not_found");
  if (args.orgId && site.org_id !== args.orgId) {
    throw new Error(`money_farm_org_site_mismatch:${args.orgId}:${site.id}`);
  }

  const businessName = site.business_name ?? site.name;
  const outDir = args.outDir ?? path.join(repoRoot(), ".tmp/money-farm");
  mkdirSync(outDir, { recursive: true });

  const mockPlace = fixture.places_mock?.[site.id];
  let deterministic: DeterministicOutput;
  let mode: RunLocationReportResult["mode"];

  if ((args.forceFixturePlaces || !isPlacesConfigured()) && mockPlace) {
    deterministic = runDeterministicFromFixturePlace({ site, place: mockPlace });
    mode = "fixture_places";
  } else if (isPlacesConfigured()) {
    deterministic = await runDeterministic({
      businessName,
      city: site.city ?? undefined,
      region: site.region ?? undefined,
      zip: site.postal_code ?? undefined,
      websiteUrl: site.website_url ?? undefined,
      expectedServiceAreaZipCount: site.service_area_zips?.length ?? 0,
    });
    mode = "live_places";
  } else {
    deterministic = await runDeterministic({
      businessName,
      city: site.city ?? "Unknown",
      region: site.region ?? undefined,
      zip: site.postal_code ?? undefined,
      websiteUrl: site.website_url ?? undefined,
    });
    mode = "unconfigured_places";
  }

  const narrative = stubNarrative(deterministic, businessName);
  const slug = `${site.id.slice(0, 8)}_${(site.city ?? "site").toLowerCase()}`;
  const pdfPath = path.join(outDir, `${slug}.pdf`);
  const emailPath = path.join(outDir, `${slug}.email.html`);

  let pdf: Buffer;
  try {
    pdf = await renderLvsReportPdf({
      businessName,
      location: [site.city, site.region].filter(Boolean).join(", "),
      zip: site.postal_code ?? undefined,
      deterministic,
      narrative,
      generatedAt: new Date(),
    });
  } catch {
    pdf = stubPdfBuffer(`${businessName} ${deterministic.grade}`);
  }
  writeFileSync(pdfPath, pdf);

  writeFileSync(
    emailPath,
    stubEmailHtml({
      businessName,
      grade: deterministic.grade,
      score: deterministic.score,
      pdfPath,
      topFix: narrative.topFixes[0]?.title,
    }),
    "utf8",
  );

  return {
    orgId: site.org_id,
    siteId: site.id,
    businessName,
    mode,
    deterministic,
    narrative,
    pdfPath,
    emailPath,
    emailSent: false,
    pdfBytes: pdf.byteLength,
  };
}

export async function runAllLocationReports(
  args: Omit<RunLocationReportArgs, "siteId"> = {},
): Promise<RunLocationReportResult[]> {
  const fixture = loadMoneyFarmFixture(args.fixturePath);
  const results: RunLocationReportResult[] = [];
  for (const site of fixture.sites) {
    results.push(
      await runLocationReport({
        ...args,
        orgId: args.orgId ?? fixture.org.id,
        siteId: site.id,
      }),
    );
  }
  return results;
}
