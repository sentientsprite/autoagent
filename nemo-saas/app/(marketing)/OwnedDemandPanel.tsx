"use client";

import { useMemo, useState } from "react";

import {
  BAND_COPY,
  DEFAULT_SOURCES,
  NASHVILLE_EXAMPLE,
  QUESTIONS,
  RENTED_MARKETPLACE_ANSWERS,
  REPLACEMENT_STEPS,
  costPerBookedJob,
  emptyAnswers,
  scoreBand,
  totalScore,
  type QuestionScore,
} from "@/lib/owned-demand/scorecard";

type SourceState = {
  id: string;
  name: string;
  answers: Record<string, QuestionScore>;
};

function seedSources(demoRentedAngi: boolean): SourceState[] {
  return DEFAULT_SOURCES.map((s) => ({
    id: s.id,
    name: s.name,
    answers:
      demoRentedAngi && s.id === "angi"
        ? { ...RENTED_MARKETPLACE_ANSWERS }
        : emptyAnswers(),
  }));
}

export function OwnedDemandPanel({ demo = false }: { demo?: boolean }) {
  const [sources, setSources] = useState<SourceState[]>(() => seedSources(demo));
  const [activeId, setActiveId] = useState(() =>
    demo ? "angi" : DEFAULT_SOURCES[0]?.id ?? "angi",
  );
  const [newName, setNewName] = useState("");
  const [leadsBought, setLeadsBought] = useState(
    demo ? NASHVILLE_EXAMPLE.leadsBought : 0,
  );
  const [spend, setSpend] = useState(demo ? NASHVILLE_EXAMPLE.spend : 0);
  const [jobsBooked, setJobsBooked] = useState(
    demo ? NASHVILLE_EXAMPLE.jobsBooked : 0,
  );
  const [doneSteps, setDoneSteps] = useState<Record<string, boolean>>({});

  const active = sources.find((s) => s.id === activeId) ?? sources[0];
  const total = active ? totalScore(active.answers) : 0;
  const band = scoreBand(total);
  const bandTheme = BAND_COPY[band];
  const cpb = useMemo(
    () => costPerBookedJob(leadsBought, spend, jobsBooked),
    [leadsBought, spend, jobsBooked],
  );

  function setAnswer(qid: string, value: QuestionScore) {
    if (!active) return;
    setSources((prev) =>
      prev.map((s) =>
        s.id === active.id
          ? { ...s, answers: { ...s.answers, [qid]: value } }
          : s,
      ),
    );
  }

  function addSource() {
    const name = newName.trim();
    if (!name) return;
    const id = `custom-${Date.now()}`;
    setSources((prev) => [...prev, { id, name, answers: emptyAnswers() }]);
    setActiveId(id);
    setNewName("");
  }

  function loadNashvilleExample() {
    setLeadsBought(NASHVILLE_EXAMPLE.leadsBought);
    setSpend(NASHVILLE_EXAMPLE.spend);
    setJobsBooked(NASHVILLE_EXAMPLE.jobsBooked);
    setActiveId("angi");
    setSources((prev) =>
      prev.map((s) =>
        s.id === "angi" ? { ...s, answers: { ...RENTED_MARKETPLACE_ANSWERS } } : s,
      ),
    );
  }

  if (!active) return null;

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={card}>
        <p style={eyebrow}>Owned demand scorecard</p>
        <h2 style={title}>Score each lead source — then move one toward owned proof</h2>
        <p style={body}>
          Rate a source 0–2 on seven questions (max 14). Rented demand is 0–5, mixed 6–10,
          owned 11–14. The goal is not “turn ads off” — it is replacing rented intros with
          assets you control, one source at a time.
        </p>

        <p style={{ ...eyebrow, marginTop: 8 }}>Your lead sources</p>
        <div style={chipRow}>
          {sources.map((s) => {
            const t = totalScore(s.answers);
            const b = scoreBand(t);
            const selected = s.id === active.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setActiveId(s.id)}
                style={{
                  ...chip,
                  borderColor: selected ? BAND_COPY[b].color : "#e2e8f0",
                  background: selected ? BAND_COPY[b].bg : "#fff",
                  fontWeight: selected ? 700 : 600,
                }}
              >
                {s.name}
                <span style={{ color: BAND_COPY[b].color, marginLeft: 6 }}>{t}</span>
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Add a source (e.g. Yelp)"
            style={input}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSource();
              }
            }}
          />
          <button type="button" onClick={addSource} style={secondaryBtn}>
            Add
          </button>
        </div>
      </div>

      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "20px 20px 16px",
            background: bandTheme.bg,
            display: "flex",
            gap: 16,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              ...scoreRing,
              borderColor: bandTheme.color,
              color: bandTheme.color,
            }}
          >
            {total}
          </div>
          <div style={{ flex: 1, minWidth: 180 }}>
            <p style={{ margin: 0, fontSize: 12, letterSpacing: 1, textTransform: "uppercase", color: "#64748b" }}>
              {active.name} · / 14
            </p>
            <p style={{ margin: "4px 0 0", fontSize: 22, fontWeight: 800, color: bandTheme.color }}>
              {bandTheme.label}
              <span style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8", marginLeft: 8 }}>
                ({bandTheme.range})
              </span>
            </p>
            <p style={{ margin: "6px 0 0", fontSize: 14, color: "#475569", lineHeight: 1.45 }}>
              {bandTheme.blurb}
            </p>
          </div>
        </div>

        <div style={{ padding: 20, display: "grid", gap: 14 }}>
          {QUESTIONS.map((q) => {
            const value = active.answers[q.id] ?? 0;
            return (
              <div key={q.id} style={questionRow}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a", lineHeight: 1.4 }}>
                    {q.prompt}
                  </p>
                  <p style={{ margin: "4px 0 0", fontSize: 12, color: "#94a3b8" }}>{q.scaleHint}</p>
                </div>
                <div style={scoreBtns} role="group" aria-label={q.prompt}>
                  {([0, 1, 2] as QuestionScore[]).map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setAnswer(q.id, n)}
                      aria-pressed={value === n}
                      style={{
                        ...scoreBtn,
                        background: value === n ? "#0f766e" : "#fff",
                        color: value === n ? "#fff" : "#334155",
                        borderColor: value === n ? "#0f766e" : "#cbd5e1",
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <p style={eyebrow}>Booked-job math</p>
            <p style={{ margin: "4px 0 0", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
              Cost per booked job
            </p>
          </div>
          <button type="button" onClick={loadNashvilleExample} style={linkish}>
            Load Nashville plumber example
          </button>
        </div>
        <p style={{ ...body, marginTop: 8 }}>
          Marketplace leads often look cheap until you divide spend by jobs that actually book.
        </p>
        <div style={mathGrid}>
          <label style={fieldLabel}>
            Leads bought
            <input
              type="number"
              min={0}
              value={leadsBought || ""}
              onChange={(e) => setLeadsBought(Number(e.target.value) || 0)}
              style={input}
            />
          </label>
          <label style={fieldLabel}>
            Spend ($)
            <input
              type="number"
              min={0}
              value={spend || ""}
              onChange={(e) => setSpend(Number(e.target.value) || 0)}
              style={input}
            />
          </label>
          <label style={fieldLabel}>
            Jobs booked
            <input
              type="number"
              min={0}
              value={jobsBooked || ""}
              onChange={(e) => setJobsBooked(Number(e.target.value) || 0)}
              style={input}
            />
          </label>
        </div>
        <div style={mathResult}>
          {cpb == null ? (
            <span style={{ color: "#64748b" }}>Enter spend and booked jobs to see cost per job.</span>
          ) : (
            <>
              <span style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}>
                ${Math.round(cpb).toLocaleString()}
              </span>
              <span style={{ color: "#64748b", fontSize: 14 }}>
                {" "}
                per booked job before labor, refunds, or no-shows
                {leadsBought > 0 && jobsBooked > 0
                  ? ` · ${Math.round((jobsBooked / leadsBought) * 100)}% book rate`
                  : ""}
              </span>
            </>
          )}
        </div>
      </div>

      <div style={card}>
        <p style={eyebrow}>Replacement plan</p>
        <p style={{ margin: "4px 0 12px", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>
          Move one source at a time from rented demand to owned proof
        </p>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 8 }}>
          {REPLACEMENT_STEPS.map((step) => {
            const checked = !!doneSteps[step.id];
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
                    onChange={() =>
                      setDoneSteps((prev) => ({ ...prev, [step.id]: !prev[step.id] }))
                    }
                    style={{ marginTop: 3, width: 16, height: 16, accentColor: "#0f766e" }}
                  />
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: checked ? "#0f766e" : "#0f172a",
                      textDecoration: checked ? "line-through" : "none",
                      lineHeight: 1.4,
                    }}
                  >
                    {step.label}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

const card: React.CSSProperties = {
  display: "grid",
  gap: 10,
  padding: 20,
  background: "#fff",
  border: "1px solid #e2e8f0",
  borderRadius: 16,
  boxShadow: "0 10px 30px -12px rgba(15,23,42,0.18)",
};

const eyebrow: React.CSSProperties = {
  margin: 0,
  fontSize: 12,
  letterSpacing: 1.2,
  textTransform: "uppercase",
  color: "#94a3b8",
  fontWeight: 700,
};

const title: React.CSSProperties = {
  margin: 0,
  fontSize: 20,
  fontWeight: 800,
  color: "#0f172a",
  lineHeight: 1.25,
};

const body: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  color: "#475569",
  lineHeight: 1.55,
};

const chipRow: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

const chip: React.CSSProperties = {
  border: "1px solid #e2e8f0",
  borderRadius: 999,
  padding: "8px 12px",
  fontSize: 13,
  background: "#fff",
  color: "#0f172a",
  cursor: "pointer",
};

const input: React.CSSProperties = {
  flex: 1,
  minWidth: 160,
  padding: "10px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  fontSize: 14,
  color: "#0f172a",
  outline: "none",
  boxSizing: "border-box",
};

const secondaryBtn: React.CSSProperties = {
  padding: "10px 14px",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  background: "#f8fafc",
  color: "#0f172a",
  fontWeight: 700,
  fontSize: 14,
  cursor: "pointer",
};

const scoreRing: React.CSSProperties = {
  width: 72,
  height: 72,
  flexShrink: 0,
  borderRadius: "50%",
  border: "4px solid",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: 28,
  fontWeight: 800,
  background: "#fff",
};

const questionRow: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr)",
  gap: 10,
  alignItems: "start",
  paddingBottom: 12,
  borderBottom: "1px solid #f1f5f9",
};

const scoreBtns: React.CSSProperties = {
  display: "flex",
  gap: 6,
};

const scoreBtn: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 10,
  border: "1px solid",
  fontWeight: 800,
  fontSize: 15,
  cursor: "pointer",
};

const mathGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
  gap: 10,
  marginTop: 8,
};

const fieldLabel: React.CSSProperties = {
  display: "grid",
  gap: 6,
  fontSize: 12,
  fontWeight: 700,
  color: "#64748b",
};

const mathResult: React.CSSProperties = {
  marginTop: 12,
  padding: "14px 16px",
  background: "#f8fafc",
  borderRadius: 12,
  border: "1px solid #eef2f7",
};

const linkish: React.CSSProperties = {
  border: "none",
  background: "transparent",
  color: "#0f766e",
  fontWeight: 700,
  fontSize: 13,
  cursor: "pointer",
  padding: 0,
};
