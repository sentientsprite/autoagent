import type { CSSProperties } from "react";
import Link from "next/link";

import { linkBtn } from "@/lib/portal-hub-styles";

const wrap: CSSProperties = {
  marginTop: 40,
  padding: 24,
  borderRadius: 12,
  border: "1px solid #e2e8f0",
  background: "linear-gradient(180deg, #f8fafc 0%, #fff 100%)",
};

const h2: CSSProperties = {
  margin: "0 0 8px",
  fontSize: 22,
  color: "#0f172a",
};

const lead: CSSProperties = {
  margin: "0 0 16px",
  fontSize: 15,
  lineHeight: 1.55,
  color: "#475569",
};

const grid: CSSProperties = {
  display: "grid",
  gap: 16,
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
};

/** Public sales clips on https://www.youtube.com/@symbiote-seo — no client Meet recordings. */
const SALES_VIDEOS = [
  {
    id: "0tPiLVCZMog",
    title: "How AI Recommends Local Businesses",
    blurb: "GEO / citation angle for Founding demos.",
  },
  {
    id: "NnwsJjWNlTs",
    title: "How We Win Local Search in the AI Era",
    blurb: "Maps + AI search story for warm closes.",
  },
  {
    id: "tdmQi2KkbeM",
    title: "Why Modern Local SEO Drives More Revenue",
    blurb: "Revenue framing before the Founding ask.",
  },
] as const;

/**
 * Sales perks — YouTube embeds from @symbiote-seo (Owner channel).
 * Prefer embeds over shipping large .mov/.webm in the repo.
 */
export function SalesPerksSection() {
  return (
    <section style={wrap} aria-labelledby="sales-perks-heading">
      <p
        style={{
          margin: "0 0 6px",
          fontSize: 11,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "#64748b",
        }}
      >
        Sales perk · Founding demos
      </p>
      <h2 id="sales-perks-heading" style={h2}>
        Play the Symbiote AI SEO clips
      </h2>
      <p style={lead}>
        From{" "}
        <a href="https://www.youtube.com/@symbiote-seo" style={{ color: "#0f172a" }}>
          youtube.com/@symbiote-seo
        </a>
        . Use on warm Founding calls with HQ locations + free LVS — not client meeting recordings.
      </p>
      <div style={grid}>
        {SALES_VIDEOS.map((v) => (
          <figure key={v.id} style={{ margin: 0 }}>
            <div
              style={{
                position: "relative",
                paddingBottom: "56.25%",
                height: 0,
                overflow: "hidden",
                borderRadius: 10,
                background: "#0f172a",
              }}
            >
              <iframe
                title={v.title}
                src={`https://www.youtube-nocookie.com/embed/${v.id}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                loading="lazy"
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  border: 0,
                }}
              />
            </div>
            <figcaption style={{ marginTop: 8 }}>
              <p style={{ margin: "0 0 2px", fontSize: 14, fontWeight: 650, color: "#0f172a" }}>{v.title}</p>
              <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>{v.blurb}</p>
            </figcaption>
          </figure>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 18 }}>
        <Link
          href="/hq/locations?orgId=00000000-0000-0000-0000-000000000001&fixture=1&plan=local_autopilot"
          style={linkBtn}
        >
          HQ founding demo →
        </Link>
        <a href="https://www.youtube.com/@symbiote-seo" style={linkBtn} target="_blank" rel="noreferrer">
          Full channel →
        </a>
      </div>
    </section>
  );
}
