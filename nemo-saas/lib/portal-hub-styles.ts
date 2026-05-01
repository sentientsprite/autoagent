import type { CSSProperties } from "react";

/** Shared layout tokens for portal hubs (inline styles, no new CSS pipeline). */
export const hubMain: CSSProperties = {
  fontFamily: "system-ui, sans-serif",
  padding: "32px 24px 72px",
  maxWidth: 960,
  margin: "0 auto",
};

export const hubH1: CSSProperties = {
  fontSize: "clamp(26px, 3.5vw, 36px)",
  lineHeight: 1.15,
  margin: "0 0 8px",
  color: "#111",
};

export const hubLead: CSSProperties = {
  fontSize: 16,
  color: "#444",
  marginBottom: 28,
  lineHeight: 1.5,
};

export const grid: CSSProperties = {
  display: "grid",
  gap: 16,
  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
};

export function cardShell(internal?: boolean): CSSProperties {
  return {
    border: internal ? "1px solid #dbeafe" : "1px solid #eaeaea",
    borderRadius: 12,
    padding: 20,
    background: internal ? "#f8fafc" : "#fff",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    minHeight: 160,
  };
}

export const cardTitle: CSSProperties = {
  fontSize: 17,
  fontWeight: 650,
  color: "#111",
  margin: 0,
};

export const cardBody: CSSProperties = {
  fontSize: 14,
  color: "#444",
  lineHeight: 1.45,
  flex: 1,
  margin: 0,
};

export const badge: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 0.6,
  color: "#555",
};

export const linkBtn: CSSProperties = {
  display: "inline-block",
  marginTop: "auto",
  fontSize: 14,
  fontWeight: 600,
  color: "#1e40af",
  textDecoration: "none",
};

export const mutedNote: CSSProperties = {
  fontSize: 12,
  color: "#64748b",
  marginTop: 20,
  lineHeight: 1.45,
};
