import type { Metadata } from "next";
import Link from "next/link";

import { dgtlMkgtAssistAppUrl, github, growthCoachStoreUrl } from "@/lib/access-directory";
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
  title: "Customer portal | Nemo Local",
  description:
    "Links to GrowthCoach Chrome extension, DGTL Marketing Assistant, and Prana product surfaces.",
};

export default function CustomerPortalPage() {
  const storeUrl = growthCoachStoreUrl();
  const assistUrl = dgtlMkgtAssistAppUrl();

  return (
    <main style={hubMain}>
      <p style={{ ...badge, marginBottom: 8 }}>Customers</p>
      <h1 style={hubH1}>Your tools &amp; product portals</h1>
      <p style={hubLead}>
        Public hub for buyers. Each product keeps its own login or Chrome install — this page only routes you there.
        Authenticated customer dashboards (Beacon/Echo/Bloom) ship with Phase 4; placeholders below point at SKU overviews.
      </p>

      <section style={grid}>
        <article style={cardShell()}>
          <p style={badge}>Free · Browser</p>
          <h2 style={cardTitle}>GrowthCoach Chrome extension</h2>
          <p style={cardBody}>
            DGTL Marketing GrowthCoach — signals inside Google tools. Chrome Web Store link when published; repo for
            builds and issues.
          </p>
          {storeUrl ? (
            <Link href={storeUrl} target="_blank" rel="noreferrer" style={linkBtn}>
              Chrome Web Store →
            </Link>
          ) : (
            <Link href={github.chromeGrowthCoach} target="_blank" rel="noreferrer" style={linkBtn}>
              GitHub: MKTG-Chrome-Extenstion →
            </Link>
          )}
        </article>

        <article style={cardShell()}>
          <p style={badge}>Product</p>
          <h2 style={cardTitle}>DGTL Marketing Assistant</h2>
          <p style={cardBody}>
            DGTL-MKTG-ASST — strategist workflows and extension/backend surface (repo{" "}
            <code style={{ fontSize: 12 }}>spryte-engine/DGTL-MKTG-ASST-main</code>
            ).
          </p>
          {assistUrl ? (
            <Link href={assistUrl} target="_blank" rel="noreferrer" style={linkBtn}>
              Open app →
            </Link>
          ) : (
            <Link href={github.dgtlMkgtAssist} target="_blank" rel="noreferrer" style={linkBtn}>
              GitHub repo →
            </Link>
          )}
        </article>

        <article style={cardShell()}>
          <p style={badge}>SKU overview</p>
          <h2 style={cardTitle}>Beacon · GBP Autopilot</h2>
          <p style={cardBody}>Marketing overview on this site. Customer-facing dashboard + SSO — placeholder.</p>
          <Link href="/products/beacon" style={linkBtn}>
            Read SKU →
          </Link>
        </article>

        <article style={cardShell()}>
          <p style={badge}>SKU overview</p>
          <h2 style={cardTitle}>Echo · Review flywheel</h2>
          <p style={cardBody}>Customer portal post-job triggers + replies — placeholder until wired.</p>
          <Link href="/products/echo" style={linkBtn}>
            Read SKU →
          </Link>
        </article>

        <article style={cardShell()}>
          <p style={badge}>SKU overview</p>
          <h2 style={cardTitle}>Bloom · Seasonal content</h2>
          <p style={cardBody}>Calendar + drafts — placeholder client workspace.</p>
          <Link href="/products/bloom" style={linkBtn}>
            Read SKU →
          </Link>
        </article>

        <article style={cardShell()}>
          <p style={badge}>Free · Lead magnet</p>
          <h2 style={cardTitle}>Local Visibility Score</h2>
          <p style={cardBody}>Anonymous wedge PDF path — same funnel as the homepage.</p>
          <Link href="/" style={linkBtn}>
            Get score →
          </Link>
        </article>
      </section>

      <p style={mutedNote}>
        <strong>Missing?</strong> Paid analytics dashboard per tenant, unified SSO across Beacon/Echo/Bloom, and
        white-label portal domains — tracked in{" "}
        <Link href="/team" style={{ color: "#334155" }}>
          team hub notes
        </Link>{" "}
        / trunk docs. Chrome Store + DGTL app URLs: set{" "}
        <code style={{ fontSize: 11 }}>NEXT_PUBLIC_GROWTHCOACH_STORE_URL</code> and{" "}
        <code style={{ fontSize: 11 }}>NEXT_PUBLIC_DGTL_MKTG_ASSIST_URL</code> on Vercel.
      </p>
    </main>
  );
}
