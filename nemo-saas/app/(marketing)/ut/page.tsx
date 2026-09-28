import type { Metadata } from "next";
import Link from "next/link";

import { hubH1, hubLead, hubMain, linkBtn, mutedNote } from "@/lib/portal-hub-styles";

export const metadata: Metadata = {
  title: "Utah local SEO & GEO guides | Nemo Local",
  description:
    "Utah pSEO guides for plumbing, HVAC, roofing, electrical, and service-area shops — Maps first, then GEO.",
};

const PAGES = [
  {
    href: "/ut/salt-lake-city/plumber-google-maps-visibility",
    title: "Why bigger plumbers beat you on Salt Lake Maps",
    niche: "Plumbing · Salt Lake City",
  },
  {
    href: "/ut/provo/hvac-ai-seo-vs-google-maps",
    title: "Is AI SEO a second website for Provo HVAC?",
    niche: "HVAC · Provo",
  },
  {
    href: "/ut/salt-lake-city/roofer-google-review-velocity",
    title: "Does one Google review a week beat a burst?",
    niche: "Roofing · Salt Lake City",
  },
  {
    href: "/ut/salt-lake-city/electrician-gbp-website-link",
    title: "Google profile website: homepage or service page?",
    niche: "Electrical · Salt Lake City",
  },
  {
    href: "/ut/salt-lake-city/electrician-ppc-seo-same-landing",
    title: "Should paid ads and SEO share the same landing?",
    niche: "Electrical · Salt Lake City",
  },
  {
    href: "/ut/orem/hvac-google-maps-visibility",
    title: "Why isn’t my Orem heating and air shop on Maps?",
    niche: "HVAC · Orem / Utah County",
  },
  {
    href: "/ut/salt-lake-city/service-area-gbp-too-vague",
    title: "Vague service-area Google profile? You lose the map pack",
    niche: "Service-area · Salt Lake City",
  },
  {
    href: "/ut/ogden/roofer-google-review-replies",
    title: "Ogden roofers: do ignored reviews hurt Maps?",
    niche: "Roofing · Ogden / Weber",
  },
] as const;

export default function UtahPseoIndexPage() {
  return (
    <main style={hubMain}>
      <p style={{ fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", color: "#64748b", margin: 0 }}>
        Utah · pSEO / GEO
      </p>
      <h1 style={hubH1}>Local guides for Utah home services</h1>
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
        <Link href="/id" style={{ color: "#64748b" }}>
          Idaho guides
        </Link>
        {" · "}
        <Link href="/portal" style={{ color: "#64748b" }}>
          Customer portal
        </Link>
      </p>
    </main>
  );
}
