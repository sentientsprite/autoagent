import type { Metadata } from "next";
import Link from "next/link";

import { badge, hubH1, hubLead, hubMain, linkBtn, mutedNote } from "@/lib/portal-hub-styles";

import { LocationsClient } from "./LocationsClient";

export const metadata: Metadata = {
  title: "HQ locations | Nemo Local",
  description: "Mock-safe HQ view of org locations under the plan location cap.",
};

const SEED_ORG_ID = "00000000-0000-0000-0000-000000000001";
const UUID_RE = /^[0-9a-f-]{36}$/i;

export default async function HqLocationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = typeof sp.orgId === "string" ? sp.orgId : typeof sp.org === "string" ? sp.org : "";
  const orgId = raw.trim();
  const validOrgId = orgId && UUID_RE.test(orgId) ? orgId : "";

  return (
    <main style={hubMain}>
      <p style={{ ...badge, marginBottom: 8 }}>Money Farm · HQ</p>
      <h1 style={hubH1}>Locations</h1>
      <p style={hubLead}>
        Thin HQ stub over the locations API. Shows plan cap, count, and sites for one org. Mock-safe —
        no Stripe and no Places required for this page.
      </p>

      {validOrgId ? (
        <LocationsClient orgId={validOrgId} />
      ) : (
        <section
          style={{
            border: "1px solid #eaeaea",
            borderRadius: 12,
            padding: 20,
            background: "#fff",
            maxWidth: 560,
          }}
        >
          <p style={{ margin: "0 0 12px", fontSize: 14, color: "#334155", lineHeight: 1.5 }}>
            Pass an org id to load locations. Example:
          </p>
          <code
            style={{
              display: "block",
              fontSize: 12,
              padding: "10px 12px",
              background: "#f8fafc",
              borderRadius: 8,
              color: "#0f172a",
              marginBottom: 16,
              wordBreak: "break-all",
            }}
          >
            /hq/locations?orgId={SEED_ORG_ID}
          </code>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b", lineHeight: 1.45 }}>
            Seed fixture org (Acme Landscaping — two sites in{" "}
            <code style={{ fontSize: 11 }}>fixtures/money-farm/org-two-locations.json</code>
            ). Needs a seeded local DB for live rows; empty/error states stay friendly either way.
          </p>
          <Link href={`/hq/locations?orgId=${SEED_ORG_ID}`} style={linkBtn}>
            Load seed fixture org →
          </Link>
        </section>
      )}

      <p style={mutedNote}>
        <Link href="/portal" style={{ color: "#334155" }}>
          ← Back to portal
        </Link>
        {" · "}
        API: <code style={{ fontSize: 11 }}>GET /api/money-farm/locations?orgId=</code>
      </p>
    </main>
  );
}
