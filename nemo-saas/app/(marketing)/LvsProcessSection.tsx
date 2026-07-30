import type { CSSProperties } from "react";

/**
 * Close-ready LVS process graphics for the public wedge landing.
 * Light theme to match HomeClient (teal #0f766e).
 */
export function LvsProcessSection() {
  return (
    <div style={{ marginTop: 48, display: "grid", gap: 40 }}>
      <div>
        <p style={sectionLabel}>What you&apos;re signing up for</p>
        <h2 style={h2}>A full Local Visibility Score — proof you can close on.</h2>
        <p style={body}>
          Built for warmer leads and sales demos. You get a graded scorecard, ranked action
          checklists, and a PDF by email. We look up your Google Business Profile with live
          Places data when your listing matches name + ZIP.
        </p>
        <AuditFlowDiagram />
      </div>

      <div>
        <p style={sectionLabel}>What the score covers</p>
        <ScopeDiagram />
      </div>

      <div>
        <p style={sectionLabel}>What happens after you submit</p>
        <AfterSubmitDiagram />
      </div>
    </div>
  );
}

function AuditFlowDiagram() {
  const steps = [
    { n: "1", t: "Name + ZIP", d: "Optional website. Email required for the PDF." },
    { n: "2", t: "Google lookup", d: "We search Places for your Business Profile." },
    { n: "3", t: "Score + checklist", d: "Grade, ranked fixes, expandable how-tos." },
    { n: "4", t: "PDF in inbox", d: "Report emailed. Sales can follow up from there." },
  ];
  return (
    <div
      style={{ marginTop: 20 }}
      role="img"
      aria-label="Process: enter name and ZIP, Google Places lookup, scorecard, PDF email"
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12,
          alignItems: "stretch",
        }}
      >
        {steps.map((s) => (
          <div key={s.n} style={node}>
            <p style={nodeN}>{s.n}</p>
            <p style={nodeT}>{s.t}</p>
            <p style={nodeD}>{s.d}</p>
          </div>
        ))}
      </div>
      <p style={{ ...fine, marginTop: 14 }}>
        Free · No credit card · Live GBP when your listing is found · Honest “not found” if Places
        has no match
      </p>
    </div>
  );
}

function ScopeDiagram() {
  const rows = [
    { label: "Google Business Profile match", kind: "Live Places", w: "92%", color: "#0f766e" },
    { label: "Categories, photos, hours, NAP", kind: "From GBP", w: "78%", color: "#0d9488" },
    { label: "Reviews & rating signals", kind: "From GBP", w: "70%", color: "#0d9488" },
    { label: "Ranked action checklists", kind: "Always", w: "88%", color: "#115e59" },
    { label: "One-page PDF report", kind: "Emailed", w: "85%", color: "#115e59" },
  ];
  return (
    <div style={card} role="img" aria-label="Diagram of what the Local Visibility Score covers">
      <div style={{ display: "grid", gap: 16 }}>
        {rows.map((r) => (
          <div key={r.label}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{r.label}</span>
              <span style={{ fontSize: 11, letterSpacing: 0.6, textTransform: "uppercase", color: "#64748b" }}>
                {r.kind}
              </span>
            </div>
            <div style={barTrack}>
              <div style={{ ...barFill, width: r.w, background: r.color }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AfterSubmitDiagram() {
  const steps = [
    { n: "01", t: "Score on screen", d: "Grade, findings, and do-first checklist immediately." },
    { n: "02", t: "PDF emailed", d: "Same report in your inbox to share or keep." },
    { n: "03", t: "Sales follow-up", d: "We can walk the score on a growth-plan call — nothing auto-publishes." },
  ];
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 12,
      }}
      role="img"
      aria-label="After submit: on-screen score, PDF email, optional sales follow-up"
    >
      {steps.map((s) => (
        <div key={s.n} style={{ ...node, textAlign: "left", padding: "18px 16px" }}>
          <p style={{ ...nodeN, color: "#0f766e" }}>{s.n}</p>
          <p style={{ ...nodeT, fontSize: 16 }}>{s.t}</p>
          <p style={nodeD}>{s.d}</p>
        </div>
      ))}
    </div>
  );
}

const sectionLabel: CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: 1.4,
  textTransform: "uppercase",
  color: "#0f766e",
  margin: 0,
};

const h2: CSSProperties = {
  fontSize: "clamp(22px, 3vw, 32px)",
  fontWeight: 800,
  color: "#0f172a",
  margin: "10px 0 12px",
  lineHeight: 1.2,
  letterSpacing: "-0.02em",
};

const body: CSSProperties = {
  fontSize: 16,
  lineHeight: 1.55,
  color: "#475569",
  margin: "0 0 8px",
  maxWidth: 640,
};

const fine: CSSProperties = {
  fontSize: 13,
  color: "#64748b",
  margin: 0,
  lineHeight: 1.45,
};

const card: CSSProperties = {
  marginTop: 16,
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 12px 40px -24px rgba(15, 23, 42, 0.25)",
};

const node: CSSProperties = {
  flex: 1,
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  padding: "16px 12px",
  textAlign: "center",
  minWidth: 0,
};

const nodeN: CSSProperties = {
  margin: 0,
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 1.2,
  color: "#94a3b8",
};

const nodeT: CSSProperties = {
  margin: "8px 0 6px",
  fontSize: 15,
  fontWeight: 800,
  color: "#0f172a",
};

const nodeD: CSSProperties = {
  margin: 0,
  fontSize: 12,
  lineHeight: 1.45,
  color: "#64748b",
};

const barTrack: CSSProperties = {
  height: 8,
  borderRadius: 999,
  background: "#f1f5f9",
  overflow: "hidden",
};

const barFill: CSSProperties = {
  height: "100%",
  borderRadius: 999,
};
