import type { Metadata } from "next";
import Link from "next/link";

import {
  github,
  hunterUiUrl,
  outboundCrmBaseUrl,
  pranaDashboardUrl,
  tradingDashboardUrl,
} from "@/lib/access-directory";
import {
  badge,
  cardBody,
  cardShell,
  cardTitle,
  grid,
  hubH1,
  hubLead,
  hubMain,
  linkBtn,
  mutedNote,
} from "@/lib/portal-hub-styles";

export const metadata: Metadata = {
  title: "Team hub | Prana",
  description: "Internal links for sales and operators — CRM, Hunter, dashboards, bots.",
  robots: { index: false, follow: false },
};

export default function TeamPortalPage() {
  const crm = outboundCrmBaseUrl();
  const hunter = hunterUiUrl();
  const dash = pranaDashboardUrl();
  const trading = tradingDashboardUrl();

  return (
    <main style={hubMain}>
      <p style={{ ...badge, marginBottom: 8 }}>Employees · Internal</p>
      <h1 style={hubH1}>Sales &amp; operations hub</h1>
      <p style={hubLead}>
        Quick links for Prana staff. Each tool has its own auth (Supabase, gateway tokens, etc.). This page is not a
        substitute for SSO — it only collects bookmarks. Not indexed by search engines.
      </p>

      <section style={grid}>
        <article style={cardShell(true)}>
          <p style={badge}>Outbound · Phone closer</p>
          <h2 style={cardTitle}>Outbound CRM</h2>
          <p style={cardBody}>Queue, tel: links, Hunter webhook ingest — deploy root apps/outbound-crm.</p>
          {crm ? (
            <Link href={crm} target="_blank" rel="noreferrer" style={linkBtn}>
              Open CRM →
            </Link>
          ) : (
            <span style={{ ...linkBtn, color: "#64748b", cursor: "default" }}>
              Set NEXT_PUBLIC_PRANA_OUTBOUND_CRM_URL on Vercel
            </span>
          )}
        </article>

        <article style={cardShell(true)}>
          <p style={badge}>Lead discovery</p>
          <h2 style={cardTitle}>Hunter</h2>
          <p style={cardBody}>
            OpenClaw Hunter on Mac Mini + GitHub fixture/Places bridge. Console URL placeholder until dashboard exposes
            runs.
          </p>
          {hunter ? (
            <Link href={hunter} target="_blank" rel="noreferrer" style={linkBtn}>
              Hunter console →
            </Link>
          ) : (
            <Link href={github.hunterScheduleDoc} target="_blank" rel="noreferrer" style={linkBtn}>
              Hunter → CRM docs →
            </Link>
          )}
        </article>

        <article style={cardShell(true)}>
          <p style={badge}>Analytics</p>
          <h2 style={cardTitle}>Stats / pipeline dashboard</h2>
          <p style={cardBody}>
            Prana dashboard lives with workspace/trading stack (nemo-workspace). Wire production URL when dashboard is
            hosted.
          </p>
          {dash ? (
            <Link href={dash} target="_blank" rel="noreferrer" style={linkBtn}>
              Open dashboard →
            </Link>
          ) : (
            <Link href={github.nemoWorkspace} target="_blank" rel="noreferrer" style={linkBtn}>
              nemo-workspace repo →
            </Link>
          )}
        </article>

        <article style={cardShell(true)}>
          <p style={badge}>Trading</p>
          <h2 style={cardTitle}>Trading bot workspace</h2>
          <p style={cardBody}>
            Prediction-market / Coinbase experiments under sentientsprite/nemo-workspace — not customer-facing.
          </p>
          {trading ? (
            <Link href={trading} target="_blank" rel="noreferrer" style={linkBtn}>
              Trading dashboard →
            </Link>
          ) : (
            <Link href={`${github.nemoWorkspace}/tree/main/trading`} target="_blank" rel="noreferrer" style={linkBtn}>
              trading/ tree →
            </Link>
          )}
        </article>

        <article style={cardShell(true)}>
          <p style={badge}>Strategy bot</p>
          <h2 style={cardTitle}>DGTL Marketing strategist (workspace)</h2>
          <p style={cardBody}>
            Strategist workflows orchestrated from nemo-workspace / OpenClaw — same repo umbrella as trading;
            dedicated UI TBD.
          </p>
          <Link href={github.nemoWorkspace} target="_blank" rel="noreferrer" style={linkBtn}>
            nemo-workspace →
          </Link>
        </article>

        <article style={cardShell(true)}>
          <p style={badge}>Trunk</p>
          <h2 style={cardTitle}>NEMO-APP-v.1 hub</h2>
          <p style={cardBody}>Business plan, pipelines, workflows for outbound + components manifest.</p>
          <Link href={github.trunk} target="_blank" rel="noreferrer" style={linkBtn}>
            Open trunk repo →
          </Link>
        </article>
      </section>

      <p style={mutedNote}>
        <strong>Plan deltas:</strong> Customer Chrome extension + DGTL-MKTG-ASST remain separate deployables — surfaced on{" "}
        <Link href="/portal" style={{ color: "#334155" }}>
          /portal
        </Link>
        . Employee analytics/trading/strategist consolidate under{" "}
        <code style={{ fontSize: 11 }}>nemo-workspace</code> until split dashboards ship. Full matrix:{" "}
        <Link href="https://github.com/sentientsprite/autoagent/blob/main/nemo-saas/docs/ACCESS_AND_PORTALS.md" style={{ color: "#334155" }}>
          ACCESS_AND_PORTALS.md
        </Link>
        .
      </p>
    </main>
  );
}
