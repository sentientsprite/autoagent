import type { Metadata } from "next";

import { hubMetadata } from "@/lib/seo/pseo-metadata";
import Link from "next/link";

import { hubH1, hubLead, hubMain, linkBtn, mutedNote } from "@/lib/portal-hub-styles";

export const metadata: Metadata = hubMetadata({
  title: "Idaho local SEO & GEO guides | Nemo Local",
  description:
    "Idaho pSEO guides for concrete and home services — Maps first, then GEO citation readiness.",
  path: "/id",
});

const PAGES = [
  {
    href: "/id/boise/concrete-sealing-google-maps",
    title: "Why isn’t my Boise concrete sealing showing on Maps?",
    niche: "Concrete · Boise / Treasure Valley",
  },
] as const;

export default function IdahoPseoIndexPage() {
  return (
    <main style={hubMain}>
      <p style={{ fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", color: "#64748b", margin: 0 }}>
        Idaho · pSEO / GEO
      </p>
      <h1 style={hubH1}>Local guides for Idaho home services</h1>
      <p style={hubLead}>
        Maps first, then citation-ready pages. Each guide ends with a free Local Visibility Score CTA.
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 12, maxWidth: 640 }}>
        {PAGES.map((p) => (
          <li
            key={p.href}
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              padding: 16,
              background: "#fff",
            }}
          >
            <p style={{ margin: "0 0 4px", fontSize: 12, color: "#64748b" }}>{p.niche}</p>
            <Link href={p.href} style={{ color: "#0f172a", fontWeight: 650, textDecoration: "none" }}>
              {p.title} →
            </Link>
          </li>
        ))}
      </ul>
      <p style={{ marginTop: 28 }}>
        <Link href="/" style={linkBtn}>
          Get your free Local Visibility Score →
        </Link>
      </p>
      <p style={mutedNote}>
        <Link href="/ut" style={{ color: "#64748b" }}>
          Utah guides
        </Link>
        {" · "}
        <Link href="/portal" style={{ color: "#64748b" }}>
          Customer portal
        </Link>
      </p>
    </main>
  );
}
