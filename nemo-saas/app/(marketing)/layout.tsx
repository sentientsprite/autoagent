import Link from "next/link";
import type { ReactNode } from "react";

const navLink: React.CSSProperties = {
  fontSize: 14,
  color: "#333",
  textDecoration: "none",
  fontWeight: 500,
};

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <>
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
        <nav style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "center" }}>
          <Link href="/portal" style={navLink}>
            Customer portal
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
          <Link href="/team" style={{ ...navLink, color: "#64748b", fontSize: 13 }}>
            Team
          </Link>
        </nav>
      </header>
      {children}
    </>
  );
}
