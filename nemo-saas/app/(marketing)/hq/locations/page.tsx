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

function firstString(v: string | string[] | undefined): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && typeof v[0] === "string") return v[0];
  return "";
}

export default async function HqLocationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const raw = firstString(sp.orgId) || firstString(sp.org);
  const orgId = raw.trim();
  const validOrgId = orgId && UUID_RE.test(orgId) ? orgId : "";
  const wantFixture = firstString(sp.fixture) === "1";
  const plan = firstString(sp.plan).trim();

  return (
    <main style={hubMain}>
      <p style={{ ...badge, marginBottom: 8 }}>Money Farm · HQ</p>
      <h1 style={hubH1}>Locations</h1>
      <p style={hubLead}>
        Thin HQ stub over the locations API. Shows plan cap, count, and sites for one org. Mock-safe —
        no Stripe and no Places required for this page.
      </p>

      {validOrgId ? (
        <LocationsClient
          orgId={validOrgId}
          fixture={wantFixture}
          plan={plan || undefined}
        />
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
            Pass an org id to load locations. Offline demos use{" "}
            <code style={{ fontSize: 11 }}>fixture=1</code> (optional{" "}
            <code style={{ fontSize: 11 }}>plan=</code> override).
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
            /hq/locations?orgId={SEED_ORG_ID}&fixture=1
          </code>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: "#64748b", lineHeight: 1.45 }}>
            Seed fixture org (Acme Landscaping — two sites in{" "}
            <code style={{ fontSize: 11 }}>fixtures/money-farm/org-two-locations.json</code>
            ). Raw fixture plan stays <code style={{ fontSize: 11 }}>free</code>; use{" "}
            <code style={{ fontSize: 11 }}>plan=local_autopilot</code> for a founding-cap demo.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Link
              href={`/hq/locations?orgId=${SEED_ORG_ID}&fixture=1`}
              style={linkBtn}
            >
              Seed org · fixture (free) →
            </Link>
            <Link
              href={`/hq/locations?orgId=${SEED_ORG_ID}&fixture=1&plan=local_autopilot`}
              style={linkBtn}
            >
              Seed org · founding demo →
            </Link>
          </div>
        </section>
      )}

      <p style={mutedNote}>
        <Link href="/portal" style={{ color: "#334155" }}>
          ← Back to portal
        </Link>
        {" · "}
        API:{" "}
        <code style={{ fontSize: 11 }}>
          GET /api/money-farm/locations?orgId=&fixture=1&plan=
        </code>
      </p>
    </main>
  );
}
