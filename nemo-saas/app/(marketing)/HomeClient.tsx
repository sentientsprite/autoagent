"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface AuditResponse {
  ok: boolean;
  grade: string;
  score: number;
  reportUrl: string;
  headline?: string | null;
  findingCount?: number;
  criticalCount?: number;
  warningCount?: number;
  winCount?: number;
  topFix?: { title: string; do_this: string } | null;
  error?: string;
}

/** Fake scorecard for screenshots: open `/` with `?demo=post-submit`. */
const DEMO_RESULT: AuditResponse = {
  ok: true,
  grade: "B",
  score: 84,
  reportUrl: "https://example.com/sample-local-visibility-report.pdf",
  headline: "Strong profile, a few high-impact gaps",
  findingCount: 6,
  criticalCount: 1,
  warningCount: 2,
  winCount: 3,
  topFix: {
    title: "Add 8 more recent photos to your Google Business Profile",
    do_this:
      "Upload geo-tagged photos of recent jobs — listings with 10+ photos get ~2x more direction requests.",
  },
};

const GRADE_THEME: Record<string, { ring: string; bg: string; label: string }> = {
  A: { ring: "#16a34a", bg: "#f0fdf4", label: "Excellent" },
  B: { ring: "#0d9488", bg: "#f0fdfa", label: "Good" },
  C: { ring: "#d97706", bg: "#fffbeb", label: "Needs work" },
  D: { ring: "#ea580c", bg: "#fff7ed", label: "At risk" },
  F: { ring: "#dc2626", bg: "#fef2f2", label: "Critical" },
};

export default function HomeClient() {
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<AuditResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("demo") === "post-submit") {
      setResult(DEMO_RESULT);
      setError(null);
    }
  }, [searchParams]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setResult(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      email: String(fd.get("email")),
      businessName: String(fd.get("businessName")),
      zip: String(fd.get("zip")),
      websiteUrl: String(fd.get("websiteUrl") || "") || undefined,
    };
    try {
      const res = await fetch("/api/lvs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as AuditResponse & {
        detail?: string;
        hint?: string;
      };
      if (!res.ok || !json.ok) {
        const parts = [json.error, json.detail, json.hint].filter(Boolean);
        throw new Error(parts.join(" — ") || "Audit failed");
      }
      setResult(json as AuditResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <main style={mainStyle}>
      <div style={bgAccent} aria-hidden />
      <section style={heroStyle}>
        <span style={pillStyle}>Free · 60-second audit · No credit card</span>
        <h1 style={h1Style}>
          See exactly why local customers <span style={{ color: "#4f46e5" }}>can&apos;t find you</span> on Google.
        </h1>
        <p style={subStyle}>
          Enter your business name and ZIP. We grade your Google Business Profile, review velocity, and
          listing consistency — then email you a one-page PDF with the top fixes, ranked by impact.
        </p>

        <div style={trustRow}>
          <TrustItem label="Built for home services" />
          <TrustItem label="Same checks agencies charge $500 for" />
          <TrustItem label="Plain-English fixes" />
        </div>

        {!result ? (
          <form onSubmit={onSubmit} style={cardStyle}>
            <div style={fieldGrid}>
              <Field name="businessName" placeholder="Business name" required />
              <Field name="zip" placeholder="ZIP (e.g. 84088)" required pattern="\d{5}" inputMode="numeric" />
            </div>
            <Field name="websiteUrl" placeholder="Website (optional)" type="url" />
            <Field name="email" placeholder="Your email — we send the PDF here" required type="email" />
            <button type="submit" disabled={pending} style={{ ...btnStyle, opacity: pending ? 0.7 : 1 }}>
              {pending ? "Auditing your profile…" : "Get my free score →"}
            </button>
            <p style={fineprint}>
              We&apos;ll email your report and occasional local-marketing tips. Unsubscribe anytime.
            </p>
          </form>
        ) : (
          <Scorecard result={result} onReset={() => setResult(null)} />
        )}

        {error ? (
          <div style={errorBox}>
            <strong>Couldn&apos;t finish the audit.</strong>
            <span style={{ display: "block", marginTop: 4, color: "#7f1d1d" }}>{error}</span>
          </div>
        ) : null}

        {!result ? (
          <div style={{ marginTop: 40 }}>
            <p style={sectionLabel}>What you get in the report</p>
            <div style={featureGrid}>
              <Feature
                title="Your Local Visibility Score"
                body="A 0–100 grade across the signals that actually move local rankings."
              />
              <Feature
                title="The top fixes, ranked"
                body="No 40-page export. The 3 changes that move the needle, in priority order."
              />
              <Feature
                title="A shareable PDF"
                body="One page you can hand to whoever runs your marketing — or do it yourself."
              />
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function Scorecard({ result, onReset }: { result: AuditResponse; onReset: () => void }) {
  const theme = GRADE_THEME[result.grade] ?? GRADE_THEME.C;
  const pct = Math.max(0, Math.min(100, result.score));
  return (
    <div style={{ ...cardStyle, background: "#fff", padding: 0, overflow: "hidden" }}>
      <div style={{ display: "flex", gap: 20, alignItems: "center", padding: "24px 24px 20px", background: theme.bg }}>
        <div style={{ ...ringStyle, borderColor: theme.ring, color: theme.ring }}>{result.grade}</div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: "#64748b", margin: 0 }}>
            Your Local Visibility Score
          </p>
          <p style={{ fontSize: 32, fontWeight: 800, margin: "2px 0 6px", color: "#0f172a" }}>
            {result.score}
            <span style={{ fontSize: 16, fontWeight: 600, color: "#94a3b8" }}> / 100 · {theme.label}</span>
          </p>
          <div style={barTrack}>
            <div style={{ ...barFill, width: `${pct}%`, background: theme.ring }} />
          </div>
        </div>
      </div>

      <div style={{ padding: 24 }}>
        {result.headline ? (
          <p style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 14px" }}>{result.headline}</p>
        ) : null}

        <div style={countRow}>
          <CountPill n={result.criticalCount} label="critical" color="#dc2626" />
          <CountPill n={result.warningCount} label="to improve" color="#d97706" />
          <CountPill n={result.winCount} label="already good" color="#16a34a" />
        </div>

        {result.topFix ? (
          <div style={topFixCard}>
            <p style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", color: "#4f46e5", margin: "0 0 6px", fontWeight: 700 }}>
              Your #1 fix
            </p>
            <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 4px" }}>{result.topFix.title}</p>
            <p style={{ fontSize: 14, color: "#475569", margin: 0, lineHeight: 1.5 }}>{result.topFix.do_this}</p>
          </div>
        ) : null}

        <a href={result.reportUrl} target="_blank" rel="noreferrer" style={btnStyle}>
          Open the full report (PDF) →
        </a>

        <div style={upsellBox}>
          <span style={{ color: "#475569", fontSize: 14 }}>Want us to fix these every week, automatically?</span>
          <Link href="/products/beacon" style={{ color: "#4f46e5", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
            See Beacon →
          </Link>
        </div>

        <button onClick={onReset} style={resetBtn}>
          Audit another business
        </button>
      </div>
    </div>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={inputStyle} />;
}

function TrustItem({ label }: { label: string }) {
  return (
    <span style={trustItem}>
      <span style={{ color: "#16a34a", fontWeight: 800 }}>✓</span> {label}
    </span>
  );
}

function CountPill({ n, label, color }: { n?: number; label: string; color: string }) {
  return (
    <div style={countPill}>
      <span style={{ fontSize: 20, fontWeight: 800, color }}>{n ?? 0}</span>
      <span style={{ fontSize: 12, color: "#64748b" }}>{label}</span>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div style={featureCard}>
      <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>{title}</p>
      <p style={{ fontSize: 14, color: "#475569", margin: 0, lineHeight: 1.5 }}>{body}</p>
    </div>
  );
}

const mainStyle: React.CSSProperties = {
  fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  position: "relative",
  padding: "24px 20px 72px",
  overflow: "hidden",
};
const bgAccent: React.CSSProperties = {
  position: "absolute",
  top: -160,
  left: "50%",
  transform: "translateX(-50%)",
  width: 900,
  height: 420,
  background: "radial-gradient(closest-side, rgba(79,70,229,0.10), rgba(79,70,229,0))",
  pointerEvents: "none",
};
const heroStyle: React.CSSProperties = { position: "relative", maxWidth: 620, margin: "32px auto 0" };
const pillStyle: React.CSSProperties = {
  display: "inline-block",
  fontSize: 12,
  fontWeight: 600,
  color: "#4f46e5",
  background: "#eef2ff",
  border: "1px solid #e0e7ff",
  borderRadius: 999,
  padding: "5px 12px",
  marginBottom: 16,
};
const h1Style: React.CSSProperties = {
  fontSize: "clamp(30px, 5vw, 46px)",
  lineHeight: 1.08,
  letterSpacing: "-0.02em",
  margin: "0 0 14px",
  color: "#0f172a",
  fontWeight: 800,
};
const subStyle: React.CSSProperties = { color: "#475569", fontSize: 17, lineHeight: 1.55, marginBottom: 20 };
const trustRow: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: "8px 16px", marginBottom: 24 };
const trustItem: React.CSSProperties = { fontSize: 13, color: "#475569", display: "inline-flex", gap: 6, alignItems: "center" };
const cardStyle: React.CSSProperties = {
  display: "grid",
  gap: 10,
  padding: 20,
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  boxShadow: "0 10px 30px -12px rgba(15,23,42,0.18)",
};
const fieldGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 };
const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  fontSize: 15,
  color: "#0f172a",
  outline: "none",
  boxSizing: "border-box",
};
const btnStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  textAlign: "center",
  padding: "14px 16px",
  border: "none",
  borderRadius: 10,
  background: "#4f46e5",
  color: "#fff",
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
  textDecoration: "none",
  boxSizing: "border-box",
};
const fineprint: React.CSSProperties = { fontSize: 12, color: "#94a3b8", textAlign: "center", margin: "2px 0 0" };
const errorBox: React.CSSProperties = {
  marginTop: 16,
  padding: "12px 14px",
  background: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: 10,
  color: "#991b1b",
  fontSize: 14,
};
const sectionLabel: React.CSSProperties = {
  fontSize: 12,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  color: "#94a3b8",
  fontWeight: 700,
  margin: "0 0 12px",
};
const featureGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 };
const featureCard: React.CSSProperties = { padding: 16, background: "#f8fafc", border: "1px solid #eef2f7", borderRadius: 12 };
const ringStyle: React.CSSProperties = {
  width: 72,
  height: 72,
  flexShrink: 0,
  borderRadius: "50%",
  border: "4px solid",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 34,
  fontWeight: 800,
  background: "#fff",
};
const barTrack: React.CSSProperties = { width: "100%", height: 8, background: "#e2e8f0", borderRadius: 999, overflow: "hidden" };
const barFill: React.CSSProperties = { height: "100%", borderRadius: 999, transition: "width .6s ease" };
const countRow: React.CSSProperties = { display: "flex", gap: 10, marginBottom: 16 };
const countPill: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 2,
  padding: "12px 8px",
  background: "#f8fafc",
  border: "1px solid #eef2f7",
  borderRadius: 12,
};
const topFixCard: React.CSSProperties = {
  padding: 16,
  background: "#f5f3ff",
  border: "1px solid #e0e7ff",
  borderRadius: 12,
  marginBottom: 16,
};
const upsellBox: React.CSSProperties = {
  marginTop: 14,
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 14px",
  background: "#f8fafc",
  borderRadius: 10,
};
const resetBtn: React.CSSProperties = {
  marginTop: 12,
  width: "100%",
  padding: "10px 12px",
  border: "1px solid #e2e8f0",
  borderRadius: 10,
  background: "#fff",
  color: "#64748b",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer",
};
