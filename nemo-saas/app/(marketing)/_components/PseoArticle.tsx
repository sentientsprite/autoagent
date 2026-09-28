import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";

import { PUBLIC_BASE } from "@/lib/seo/public-paths";
import { hubH1, hubLead, hubMain, linkBtn, mutedNote } from "@/lib/portal-hub-styles";

const sectionTitle: CSSProperties = {
  fontSize: 18,
  fontWeight: 650,
  margin: "28px 0 10px",
  color: "#0f172a",
};

const body: CSSProperties = {
  fontSize: 15,
  lineHeight: 1.65,
  color: "#334155",
  margin: "0 0 12px",
};

const list: CSSProperties = {
  margin: "0 0 12px",
  paddingLeft: 20,
  color: "#334155",
  fontSize: 15,
  lineHeight: 1.6,
};

export function PseoArticle(props: {
  eyebrow: string;
  title: string;
  lead: string;
  children: ReactNode;
  ctaHref: string;
  ctaLabel?: string;
  /** State hub path, e.g. `/ut` or `/id` */
  hubPath?: string;
  hubLabel?: string;
  /** Canonical article path for BreadcrumbList JSON-LD */
  path?: string;
  related?: { href: string; title: string }[];
}) {
  const hubPath = props.hubPath ?? "/ut";
  const hubLabel = props.hubLabel ?? (hubPath === "/id" ? "Idaho guides" : "Utah guides");
  return (
    <main style={hubMain}>
      {props.path ? <PseoBreadcrumbJsonLd path={props.path} title={props.title} hubPath={hubPath} hubLabel={hubLabel} /> : null}
      <p style={{ fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", color: "#64748b", margin: "0 0 8px" }}>
        {props.eyebrow}
      </p>
      <h1 style={hubH1}>{props.title}</h1>
      <p style={hubLead}>{props.lead}</p>
      <article style={{ maxWidth: 680 }}>{props.children}</article>
      <div style={{ marginTop: 36, padding: 20, border: "1px solid #e2e8f0", borderRadius: 12, background: "#f8fafc" }}>
        <p style={{ ...body, marginBottom: 14 }}>
          Want the gaps ranked for your listing — score, checklist, PDF? Free Local Visibility Score. You stay in
          control; nothing edits your profile unsupervised.
        </p>
        <Link href={props.ctaHref} style={linkBtn}>
          {props.ctaLabel ?? "Get the free Local Visibility Score →"}
        </Link>
      </div>
      {props.related && props.related.length > 0 ? (
        <div style={{ marginTop: 28, maxWidth: 680 }}>
          <p style={{ fontSize: 13, fontWeight: 650, color: "#0f172a", margin: "0 0 8px" }}>More guides</p>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
            {props.related.map((r) => (
              <li key={r.href}>
                <Link href={r.href} style={{ color: "#334155", fontSize: 14, textDecoration: "none" }}>
                  {r.title} →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <p style={{ ...mutedNote, marginTop: 24 }}>
        <Link href={hubPath} style={{ color: "#64748b" }}>
          ← {hubLabel}
        </Link>
        {" · "}
        <Link href="/" style={{ color: "#64748b" }}>
          Nemo Local
        </Link>
      </p>
    </main>
  );
}

export function PseoH2({ children }: { children: ReactNode }) {
  return <h2 style={sectionTitle}>{children}</h2>;
}

export function PseoP({ children }: { children: ReactNode }) {
  return <p style={body}>{children}</p>;
}

export function PseoUl({ children }: { children: ReactNode }) {
  return <ul style={list}>{children}</ul>;
}

export function PseoFaq({ q, a }: { q: string; a: string }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <p style={{ ...body, fontWeight: 650, marginBottom: 4 }}>{q}</p>
      <p style={{ ...body, marginBottom: 0 }}>{a}</p>
    </div>
  );
}

/** FAQPage JSON-LD from the same Q/A already rendered on the page — no invented questions. */
export function PseoFaqJsonLd({ faqs }: { faqs: { q: string; a: string }[] }) {
  if (!faqs.length) return null;
  const data = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/** BreadcrumbList: Home → state hub → article */
export function PseoBreadcrumbJsonLd(props: {
  path: string;
  title: string;
  hubPath: string;
  hubLabel: string;
}) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: PUBLIC_BASE + "/" },
      { "@type": "ListItem", position: 2, name: props.hubLabel, item: PUBLIC_BASE + props.hubPath },
      { "@type": "ListItem", position: 3, name: props.title, item: PUBLIC_BASE + props.path },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
