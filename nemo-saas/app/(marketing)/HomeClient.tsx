"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { LvsProcessSection } from "./LvsProcessSection";
import { OwnedDemandPanel } from "./OwnedDemandPanel";

type HomeTab = "visibility" | "lead-sources";

interface ActionChecklistStep {
  id: string;
  label: string;
  detail?: string;
}

interface ActionItem {
  id: string;
  priority: "do_first" | "this_week" | "keep_going";
  severity: "critical" | "warning" | "info" | "win";
  title: string;
  why: string;
  outcome: string;
  steps: ActionChecklistStep[];
}

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
  actionItems?: ActionItem[];
  error?: string;
}

/** Fake scorecard for screenshots: open `/` with `?demo=post-submit`. */
const DEMO_RESULT: AuditResponse = {
  ok: true,
  grade: "B",
  score: 84,
  reportUrl: "https://example.com/sample-local-visibility-report.pdf",
  headline: "Strong profile — fix these three gaps this week",
  findingCount: 3,
  criticalCount: 1,
  warningCount: 2,
  winCount: 1,
  topFix: {
    title: "Add more photos to your Google Business Profile",
    do_this: "Upload geo-tagged photos of recent jobs.",
  },
  actionItems: [
    {
      id: "gbp.profile_incomplete",
      priority: "do_first",
      severity: "critical",
      title: "Finish your Google Business Profile",
      why: "Missing: phone, business hours.",
      outcome: "Completed profiles get more calls from local search.",
      steps: [
        { id: "0", label: "Open business.google.com → your listing → Edit profile" },
        { id: "1", label: "Add your phone in Info" },
        { id: "2", label: "Add business hours customers actually call you" },
        { id: "3", label: "Save, then search your name + ZIP on Google to confirm" },
      ],
    },
    {
      id: "gbp.thin_photos",
      priority: "this_week",
      severity: "warning",
      title: "Add more photos",
      why: "Only 4 photos. Listings with 10+ get more direction requests.",
      outcome: "Upload 10 fresh job photos this week.",
      steps: [
        { id: "1", label: "Gather 6+ recent job photos (before/after works best)" },
        { id: "2", label: "Google Maps → your listing → Photos → Add" },
        { id: "3", label: "Upload exteriors, completed work, and vans — no stock images" },
        { id: "4", label: "Caption with the city or neighborhood when asked" },
      ],
    },
    {
      id: "gbp.low_review_velocity",
      priority: "this_week",
      severity: "warning",
      title: "Get fresh reviews",
      why: "Only 1 new review in the last 90 days.",
      outcome: "Ask after every completed job until you hit 3+ per quarter.",
      steps: [
        { id: "1", label: "After each job, text a short review ask the same day" },
        { id: "2", label: "Use your direct Google review link from GBP" },
        { id: "3", label: "Reply to every new review within 48 hours" },
      ],
    },
    {
      id: "win.photos",
      priority: "keep_going",
      severity: "win",
      title: "Primary category looks solid",
      why: "Your main category matches how customers search.",
      outcome: "No change needed.",
      steps: [{ id: "1", label: "No change needed — keep doing this." }],
    },
  ],
};

const GRADE_THEME: Record<string, { ring: string; bg: string; label: string }> = {
  A: { ring: "#0f766e", bg: "#f0fdfa", label: "Excellent" },
  B: { ring: "#0d9488", bg: "#f0fdfa", label: "Good" },
  C: { ring: "#b45309", bg: "#fffbeb", label: "Needs work" },
  D: { ring: "#c2410c", bg: "#fff7ed", label: "At risk" },
  F: { ring: "#b91c1c", bg: "#fef2f2", label: "Critical" },
};

const PRIORITY_LABEL: Record<ActionItem["priority"], string> = {
  do_first: "Do first",
  this_week: "This week",
  keep_going: "Already good",
};

export default function HomeClient() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<HomeTab>("visibility");
  const [ownedDemo, setOwnedDemo] = useState(false);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<AuditResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const demo = searchParams.get("demo");
    if (demo === "post-submit") {
      setTab("visibility");
      setResult(DEMO_RESULT);
      setError(null);
    }
    if (demo === "owned-demand") {
      setTab("lead-sources");
      setOwnedDemo(true);
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

  const onLeadSources = tab === "lead-sources";

  return (
    <main style={mainStyle}>
      <div style={bgAccent} aria-hidden />
      <section style={heroStyle}>
        <span style={pillStyle}>
          {onLeadSources
            ? "Free · Lead-source scorecard · No login"
            : "Close-ready · Full LVS · Live Google Places"}
        </span>
        <h1 style={h1Style}>
          {onLeadSources ? (
            <>
              Stop renting leads.{" "}
              <span style={{ color: "#0f766e" }}>Build owned demand</span>.
            </>
          ) : (
            <>
              The full Local Visibility Score —{" "}
              <span style={{ color: "#0f766e" }}>proof that closes</span>.
            </>
          )}
        </h1>
        <p style={subStyle}>
          {onLeadSources
            ? "Score every lead source from 0–14. See rented vs mixed vs owned demand, run booked-job math, and follow the replacement checklist — one source at a time."
            : "For warmer leads and sales demos. Name + ZIP → live GBP lookup → graded scorecard + ranked checklist → PDF in your inbox. Built when someone asks to see the full score."}
        </p>

        <div style={tabRow} role="tablist" aria-label="Nemo Local tools">
          <button
            type="button"
            role="tab"
            aria-selected={!onLeadSources}
            onClick={() => setTab("visibility")}
            style={{
              ...tabBtn,
              background: !onLeadSources ? "#0f766e" : "#fff",
              color: !onLeadSources ? "#fff" : "#334155",
              borderColor: !onLeadSources ? "#0f766e" : "#e2e8f0",
            }}
          >
            Local Visibility
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={onLeadSources}
            onClick={() => setTab("lead-sources")}
            style={{
              ...tabBtn,
              background: onLeadSources ? "#0f766e" : "#fff",
              color: onLeadSources ? "#fff" : "#334155",
              borderColor: onLeadSources ? "#0f766e" : "#e2e8f0",
            }}
          >
            Lead sources
          </button>
        </div>

        {onLeadSources ? (
          <>
            <div style={trustRow}>
              <TrustItem label="Seven-question scorecard" />
              <TrustItem label="Booked-job cost math" />
              <TrustItem label="Owned-proof checklist" />
            </div>
            <OwnedDemandPanel key={ownedDemo ? "demo" : "live"} demo={ownedDemo} />
          </>
        ) : (
          <>
            <div style={trustRow}>
              <TrustItem label="Live GBP via Places" />
              <TrustItem label="Scorecard + PDF email" />
              <TrustItem label="Ranked how-to checklist" />
            </div>

            {!result ? (
              <form onSubmit={onSubmit} style={cardStyle}>
                <div style={fieldGrid}>
                  <Field name="businessName" placeholder="Business name" required />
                  <Field
                    name="zip"
                    placeholder="ZIP (e.g. 84088)"
                    required
                    pattern="\d{5}"
                    inputMode="numeric"
                  />
                </div>
                <Field name="websiteUrl" placeholder="Website (optional)" type="url" />
                <Field
                  name="email"
                  placeholder="Your email — we send the PDF here"
                  required
                  type="email"
                />
                <button
                  type="submit"
                  disabled={pending}
                  style={{ ...btnStyle, opacity: pending ? 0.7 : 1 }}
                >
                  {pending ? "Looking up your Google profile…" : "Get the full score →"}
                </button>
                <p style={fineprint}>
                  We email the PDF report and occasional local-marketing tips. Unsubscribe anytime.
                  Nothing publishes without a human.
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

            {!result ? <LvsProcessSection /> : null}
          </>
        )}
      </section>
    </main>
  );
}

function Scorecard({ result, onReset }: { result: AuditResponse; onReset: () => void }) {
  const theme = GRADE_THEME[result.grade] ?? GRADE_THEME.C;
  const pct = Math.max(0, Math.min(100, result.score));
  const items = result.actionItems?.length
    ? result.actionItems
    : result.topFix
      ? [
          {
            id: "top",
            priority: "do_first" as const,
            severity: "critical" as const,
            title: result.topFix.title,
            why: result.headline ?? "Highest-impact fix from this audit.",
            outcome: result.topFix.do_this,
            steps: [
              { id: "1", label: result.topFix.do_this },
              { id: "2", label: "Open business.google.com and make the change" },
              { id: "3", label: "Save, then search your business on Google to verify" },
            ],
          },
        ]
      : [];

  const todoCount = items.filter((i) => i.priority !== "keep_going").length;

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
          <p style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", margin: "0 0 6px" }}>{result.headline}</p>
        ) : null}
        <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 18px", lineHeight: 1.5 }}>
          {todoCount === 0
            ? "No urgent gaps — keep the wins below going."
            : `${todoCount} action item${todoCount === 1 ? "" : "s"} below. Expand any row for the checklist.`}
        </p>

        <div style={{ display: "grid", gap: 10 }}>
          {items.map((item, index) => (
            <ActionItemRow key={item.id} item={item} defaultOpen={index === 0 && item.priority !== "keep_going"} />
          ))}
        </div>

        <a href={result.reportUrl} target="_blank" rel="noreferrer" style={{ ...btnStyle, marginTop: 18 }}>
          Open the full report (PDF) →
        </a>

        <div style={upsellBox}>
          <span style={{ color: "#475569", fontSize: 14 }}>Want these fixed every week, automatically?</span>
          <Link href="/products/beacon" style={{ color: "#0f766e", fontWeight: 700, fontSize: 14, textDecoration: "none" }}>
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

function ActionItemRow({ item, defaultOpen }: { item: ActionItem; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const accent =
    item.severity === "critical"
      ? "#b91c1c"
      : item.severity === "warning"
        ? "#b45309"
        : item.severity === "win"
          ? "#0f766e"
          : "#475569";
  const completed = item.steps.filter((s) => done[s.id]).length;

  return (
    <div
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        overflow: "hidden",
        background: item.priority === "keep_going" ? "#f8fafc" : "#fff",
      }}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          width: "100%",
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
          textAlign: "left",
          padding: "14px 16px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            flexShrink: 0,
            marginTop: 2,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 0.4,
            textTransform: "uppercase",
            color: accent,
            background: `${accent}14`,
            borderRadius: 6,
            padding: "4px 8px",
          }}
        >
          {PRIORITY_LABEL[item.priority]}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ display: "block", fontSize: 15, fontWeight: 700, color: "#0f172a", lineHeight: 1.35 }}>
            {item.title}
          </span>
          <span style={{ display: "block", fontSize: 13, color: "#64748b", marginTop: 4, lineHeight: 1.45 }}>
            {item.why}
          </span>
        </span>
        <span style={{ flexShrink: 0, color: "#94a3b8", fontSize: 18, lineHeight: 1, marginTop: 2 }}>
          {open ? "▾" : "▸"}
        </span>
      </button>

      {open ? (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid #f1f5f9" }}>
          <p style={{ fontSize: 13, color: "#334155", margin: "12px 0 10px", lineHeight: 1.45 }}>
            <strong style={{ color: "#0f172a" }}>Done when:</strong> {item.outcome}
          </p>
          <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 8px", fontWeight: 600 }}>
            Checklist · {completed}/{item.steps.length} done
          </p>
          <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
            {item.steps.map((step) => {
              const checked = !!done[step.id];
              return (
                <li key={step.id}>
                  <label
                    style={{
                      display: "flex",
                      gap: 10,
                      alignItems: "flex-start",
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: checked ? "#f0fdfa" : "#f8fafc",
                      border: `1px solid ${checked ? "#99f6e4" : "#eef2f7"}`,
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => setDone((prev) => ({ ...prev, [step.id]: !prev[step.id] }))}
                      style={{ marginTop: 3, width: 16, height: 16, accentColor: "#0f766e" }}
                    />
                    <span>
                      <span
                        style={{
                          display: "block",
                          fontSize: 14,
                          color: checked ? "#0f766e" : "#0f172a",
                          textDecoration: checked ? "line-through" : "none",
                          lineHeight: 1.4,
                          fontWeight: 600,
                        }}
                      >
                        {step.label}
                      </span>
                      {step.detail ? (
                        <span style={{ display: "block", fontSize: 12, color: "#64748b", marginTop: 3, lineHeight: 1.4 }}>
                          {step.detail}
                        </span>
                      ) : null}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={inputStyle} />;
}

function TrustItem({ label }: { label: string }) {
  return (
    <span style={trustItem}>
      <span style={{ color: "#0f766e", fontWeight: 800 }}>✓</span> {label}
    </span>
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
  fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
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
  background: "radial-gradient(closest-side, rgba(15,118,110,0.10), rgba(15,118,110,0))",
  pointerEvents: "none",
};
const heroStyle: React.CSSProperties = { position: "relative", maxWidth: 640, margin: "32px auto 0" };
const pillStyle: React.CSSProperties = {
  display: "inline-block",
  fontSize: 12,
  fontWeight: 600,
  color: "#0f766e",
  background: "#f0fdfa",
  border: "1px solid #ccfbf1",
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
const tabRow: React.CSSProperties = {
  display: "flex",
  gap: 8,
  marginBottom: 20,
  flexWrap: "wrap",
};
const tabBtn: React.CSSProperties = {
  border: "1px solid",
  borderRadius: 999,
  padding: "10px 16px",
  fontSize: 14,
  fontWeight: 700,
  cursor: "pointer",
};
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
  background: "#0f766e",
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
