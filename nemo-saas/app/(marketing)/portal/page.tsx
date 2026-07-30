import type { Metadata } from "next";
import Link from "next/link";

import { growthCoachInstallLabel, growthCoachInstallUrl } from "@/lib/access-directory";
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
    "Install GrowthCoach, explore Beacon / Echo / Bloom, and run the close-ready Local Visibility Score with live Places.",
};

export default function CustomerPortalPage() {
  const installUrl = growthCoachInstallUrl();
  const installLabel = growthCoachInstallLabel();

  return (
    <main style={hubMain}>
      <p style={{ ...badge, marginBottom: 8 }}>Customers</p>
      <h1 style={hubH1}>Your tools &amp; products</h1>
      <p style={hubLead}>
        One place to install the extension and read what&apos;s included in each plan. Customer dashboards (Beacon / Echo
        / Bloom) ship in a later phase — SKU pages describe scope today.
      </p>

      <section style={grid}>
        <article style={cardShell()}>
          <p style={badge}>Free · Browser</p>
          <h2 style={cardTitle}>GrowthCoach extension</h2>
          <p style={cardBody}>
            Signals and shortcuts inside Google — install from Google Play (Android companion) when configured, otherwise
            the Chrome Web Store listing.
          </p>
          <Link href={installUrl} target="_blank" rel="noreferrer" style={linkBtn}>
            {installLabel}
          </Link>
        </article>

        <article style={cardShell()}>
          <p style={badge}>SKU overview</p>
          <h2 style={cardTitle}>Nemo Local — Beacon, Echo &amp; Bloom</h2>
          <p style={cardBody}>
            Three packaged automations for home-services operators. Each SKU page has pricing context; delivery is
            human-in-the-loop before anything goes live.
          </p>
          <ul style={{ margin: "12px 0 0", paddingLeft: 18, color: "#334155", fontSize: 14, lineHeight: 1.5 }}>
            <li>
              <strong>Beacon</strong> — GBP footprint: rankings signals, posts &amp; updates, citations / NAP consistency
              checks.
            </li>
            <li>
              <strong>Echo</strong> — Review flywheel: post-job prompts, draft replies, velocity and sentiment tracking.
            </li>
            <li>
              <strong>Bloom</strong> — Seasonal calendar, draft posts &amp; assets, rollout checklist per location.
            </li>
          </ul>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
            <Link href="/products/beacon" style={linkBtn}>
              Beacon →
            </Link>
            <Link href="/products/echo" style={linkBtn}>
              Echo →
            </Link>
            <Link href="/products/bloom" style={linkBtn}>
              Bloom →
            </Link>
          </div>
        </article>

        <article style={cardShell()}>
          <p style={badge}>Close-ready · Live Places</p>
          <h2 style={cardTitle}>Local Visibility Score</h2>
          <p style={cardBody}>
            Full LVS for warmer leads and demos: live Google Business Profile lookup, graded scorecard, ranked
            checklist, and PDF by email. Sales follow-up from the CRM as <code style={{ fontSize: 12 }}>lvs_wedge</code>.
          </p>
          <Link href="/" style={linkBtn}>
            Get the full score →
          </Link>
        </article>
      </section>

      <p style={mutedNote}>
        <strong>Ops note:</strong> Extension install URL uses{" "}
        <code style={{ fontSize: 11 }}>NEXT_PUBLIC_GROWTHCOACH_PLAY_STORE_URL</code> first, then{" "}
        <code style={{ fontSize: 11 }}>NEXT_PUBLIC_GROWTHCOACH_STORE_URL</code> (Chrome Web Store). Staff resources live on{" "}
        <Link href="/team" style={{ color: "#334155" }}>
          /team
        </Link>{" "}
        (not indexed).
      </p>
    </main>
  );
}
