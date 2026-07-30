import Link from "next/link";
import type { ReactNode } from "react";

const wrap: React.CSSProperties = {
  fontFamily: "system-ui, sans-serif",
  padding: "32px 24px 64px",
  maxWidth: 720,
  margin: "0 auto",
};

const eyebrow: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: 2,
  textTransform: "uppercase",
  color: "#666",
  marginBottom: 8,
};

const h1: React.CSSProperties = {
  fontSize: "clamp(28px, 4vw, 40px)",
  lineHeight: 1.15,
  margin: "0 0 12px",
  color: "#111",
};

const price: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  color: "#222",
  marginBottom: 24,
};

const ul: React.CSSProperties = {
  margin: "0 0 28px",
  paddingLeft: 20,
  color: "#333",
  lineHeight: 1.55,
};

export function ProductChrome({
  sku,
  title,
  priceLine,
  children,
}: {
  sku: string;
  title: string;
  priceLine: string;
  children: ReactNode;
}) {
  return (
    <main style={wrap}>
      <p style={eyebrow}>{sku}</p>
      <h1 style={h1}>{title}</h1>
      <p style={price}>{priceLine}</p>
      <div style={{ marginBottom: 28 }}>{children}</div>
      <p style={{ fontSize: 14, color: "#555" }}>
        Start with the{" "}
        <Link href="/" style={{ color: "#111", fontWeight: 600 }}>
          full Local Visibility Score
        </Link>{" "}
        — live GBP lookup, scorecard + PDF — then layer add-ons that match how you operate.
      </p>
    </main>
  );
}

export function BulletList({ items }: { items: string[] }) {
  return (
    <ul style={ul}>
      {items.map((t) => (
        <li key={t} style={{ marginBottom: 8 }}>
          {t}
        </li>
      ))}
    </ul>
  );
}
