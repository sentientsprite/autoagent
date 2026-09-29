/**
 * Multi-location LVS runner for Money Farm P0.
 * Caps by plan; each site → audit → PDF buffer (caller persists).
 */
import { run } from "@/lib/skills/local_visibility_audit";
import { renderLvsReportPdf } from "@/lib/pdf/lvs-report";
import { locationCap } from "@/lib/billing/money-farm";
import type { PlanTier } from "@/lib/db/types";

export interface LocationAuditInput {
  siteId?: string;
  businessName: string;
  city: string;
  region?: string;
  zip?: string;
  websiteUrl?: string;
  googleMapsUrl?: string;
}

export interface LocationAuditResult {
  siteId?: string;
  businessName: string;
  ok: boolean;
  score?: number;
  pdfBytes?: number;
  pdf?: Buffer;
  error?: string;
  durationMs: number;
}

export async function auditLocations(args: {
  plan: PlanTier;
  locations: LocationAuditInput[];
  /** Skip Places/network — for unit tests */
  dryRun?: boolean;
}): Promise<{ cappedTo: number; results: LocationAuditResult[] }> {
  const cap = locationCap(args.plan);
  const slice = args.locations.slice(0, cap);
  const results: LocationAuditResult[] = [];

  for (const loc of slice) {
    const started = Date.now();
    if (args.dryRun) {
      results.push({
        siteId: loc.siteId,
        businessName: loc.businessName,
        ok: true,
        score: 70,
        pdfBytes: 0,
        durationMs: Date.now() - started,
      });
      continue;
    }
    try {
      const result = await run(
        {
          businessName: loc.businessName,
          city: loc.city,
          region: loc.region,
          zip: loc.zip,
          websiteUrl: loc.websiteUrl,
          googleMapsUrl: loc.googleMapsUrl,
        },
        { withNarrative: true },
      );
      const pdf = await renderLvsReportPdf({
        businessName: loc.businessName,
        location: [loc.city, loc.region].filter(Boolean).join(", "),
        zip: loc.zip || undefined,
        deterministic: result.deterministic,
        narrative: result.narrative,
        generatedAt: new Date(),
      });
      results.push({
        siteId: loc.siteId,
        businessName: loc.businessName,
        ok: true,
        score: result.deterministic.score,
        pdf,
        pdfBytes: pdf.byteLength,
        durationMs: Date.now() - started,
      });
    } catch (err) {
      results.push({
        siteId: loc.siteId,
        businessName: loc.businessName,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
        durationMs: Date.now() - started,
      });
    }
  }

  return { cappedTo: cap, results };
}
