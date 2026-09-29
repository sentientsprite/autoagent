import Link from "next/link";
import type { ReactNode } from "react";

import { PUBLIC_BASE } from "@/lib/seo/public-paths";

const navLink: React.CSSProperties = {
  fontSize: 14,
  color: "#333",
  textDecoration: "none",
  fontWeight: 500,
};

function SiteJsonLd() {
  const org = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Nemo Local",
    url: PUBLIC_BASE + "/",
    description:
      "Local Visibility Score and Maps-first guides for Utah and Idaho home-service businesses.",
  };
  const site = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Nemo Local",
    url: PUBLIC_BASE + "/",
    publisher: { "@type": "Organization", name: "Nemo Local" },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(site) }} />
    </>
  );
}

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SiteJsonLd />
      <header
        style={{
          fontFamily: "system-ui, sans-serif",
          borderBottom: "1px solid #eaeaea",
          padding: "12px 24px",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 16,
          justifyContent: "space-between",
        }}
      >
        <Link href="/" style={{ fontWeight: 700, fontSize: 14, color: "#111", textDecoration: "none" }}>
          NEMO LOCAL
        </Link>
        <nav aria-label="Primary" style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
          <Link href="/portal" style={navLink}>
            Customer portal
          </Link>
          <Link href="/ut" style={navLink}>
            Utah guides
          </Link>
          <Link href="/id" style={navLink}>
            Idaho guides
          </Link>
          <Link href="/products/beacon" style={navLink}>
            Beacon
          </Link>
          <Link href="/products/echo" style={navLink}>
            Echo
          </Link>
          <Link href="/products/bloom" style={navLink}>
            Bloom
          </Link>
          <Link href="/" style={navLink}>
            Full score
          </Link>
          <span style={{ color: "#ccc", userSelect: "none" }}>|</span>
          <Link href="/team" style={{ ...navLink, fontSize: 13, color: "#64748b" }}>
            Team
          </Link>
        </nav>
      </header>
      {children}
      <footer
        style={{
          fontFamily: "system-ui, sans-serif",
          borderTop: "1px solid #eaeaea",
          padding: "16px 24px",
          fontSize: 12,
          color: "#64748b",
        }}
      >
        © {new Date().getFullYear()} Nemo Local — Maps-first guides for Utah & Idaho home services.
      </footer>
    </>
  );
}
