/**
 * Local Visibility Score PDF — emailed to wedge leads and viewable in-app.
 *
 * Uses @react-pdf/renderer (server-side). Keep the layout tight: this PDF
 * needs to load on a phone in 2 seconds and be skim-able in 30.
 */
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import React from "react";

import type { DeterministicOutput, NarrativeOutput } from "@/lib/skills/local_visibility_audit";

const INDIGO = "#4f46e5";
const INK = "#0f172a";
const MUTED = "#475569";
const FAINT = "#94a3b8";

const GRADE_COLOR: Record<string, string> = {
  A: "#16a34a",
  B: "#0d9488",
  C: "#d97706",
  D: "#ea580c",
  F: "#dc2626",
};

const GRADE_LABEL: Record<string, string> = {
  A: "Excellent",
  B: "Good",
  C: "Needs work",
  D: "At risk",
  F: "Critical",
};

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#dc2626",
  warning: "#d97706",
  info: "#2563eb",
  win: "#16a34a",
};

const SEVERITY_LABEL: Record<string, string> = {
  critical: "CRITICAL",
  warning: "IMPROVE",
  info: "NOTE",
  win: "GOOD",
};

const s = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 56, paddingHorizontal: 40, fontSize: 10.5, fontFamily: "Helvetica", color: INK },

  brandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  brand: { fontSize: 9, color: INDIGO, fontFamily: "Helvetica-Bold", letterSpacing: 1 },
  brandMeta: { fontSize: 8, color: FAINT },

  h1: { fontSize: 22, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  sub: { fontSize: 10, color: MUTED, marginBottom: 16 },

  scoreCard: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 16,
    marginBottom: 18,
  },
  gradeBadge: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  gradeText: { fontSize: 30, fontFamily: "Helvetica-Bold" },
  scoreNum: { fontSize: 20, fontFamily: "Helvetica-Bold" },
  scoreCaption: { fontSize: 9, color: FAINT, textTransform: "uppercase", letterSpacing: 1 },
  barTrack: { height: 6, backgroundColor: "#e2e8f0", borderRadius: 3, marginTop: 8 },
  barFill: { height: 6, borderRadius: 3 },
  countsRow: { flexDirection: "row", marginTop: 8 },
  countChip: { fontSize: 9, color: MUTED, marginRight: 14 },

  sectionTitle: { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 8, marginBottom: 8 },
  summary: { fontSize: 10.5, color: MUTED, lineHeight: 1.5, marginBottom: 14 },

  fix: {
    marginBottom: 8,
    padding: 10,
    backgroundColor: "#f5f3ff",
    borderLeftWidth: 3,
    borderLeftColor: INDIGO,
    borderRadius: 3,
  },
  fixTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  fixWhy: { color: MUTED, lineHeight: 1.45, marginBottom: 3 },
  fixDo: { fontFamily: "Helvetica-Bold", color: INK, lineHeight: 1.45 },

  finding: { flexDirection: "row", alignItems: "flex-start", marginBottom: 9 },
  sevTag: {
    width: 52,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#fff",
    textAlign: "center",
    paddingTop: 3,
    paddingBottom: 3,
    borderRadius: 3,
    marginRight: 8,
    marginTop: 1,
    alignSelf: "flex-start",
  },
  findingBody: { flex: 1 },
  findingTitle: { fontFamily: "Helvetica-Bold", marginBottom: 1 },
  findingMsg: { color: MUTED, lineHeight: 1.4 },
  findingAction: { color: INDIGO, marginTop: 1, lineHeight: 1.4 },

  footer: {
    position: "absolute",
    bottom: 28,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#eef2f7",
    paddingTop: 8,
    fontSize: 8,
    color: FAINT,
    lineHeight: 1.4,
  },
});

export async function renderLvsReportPdf(args: {
  businessName: string;
  zip: string;
  deterministic: DeterministicOutput;
  narrative?: NarrativeOutput;
  generatedAt: Date;
}): Promise<Buffer> {
  const { businessName, zip, deterministic, narrative, generatedAt } = args;
  const gradeColor = GRADE_COLOR[deterministic.grade] ?? MUTED;
  const gradeLabel = GRADE_LABEL[deterministic.grade] ?? "";
  const criticalCount = deterministic.insights.filter((i) => i.severity === "critical").length;
  const warningCount = deterministic.insights.filter((i) => i.severity === "warning").length;
  const winCount = deterministic.insights.filter((i) => i.severity === "win").length;
  const pct = Math.max(0, Math.min(100, deterministic.score));

  const doc = (
    <Document title={`Local Visibility Score — ${businessName}`}>
      <Page size="LETTER" style={s.page}>
        <View style={s.brandRow}>
          <Text style={s.brand}>NEMO LOCAL · LOCAL VISIBILITY SCORE</Text>
          <Text style={s.brandMeta}>{generatedAt.toISOString().slice(0, 10)}</Text>
        </View>

        <Text style={s.h1}>{businessName}</Text>
        <Text style={s.sub}>Local visibility audit · ZIP {zip}</Text>

        <View style={s.scoreCard}>
          <View style={[s.gradeBadge, { borderColor: gradeColor }]}>
            <Text style={[s.gradeText, { color: gradeColor }]}>{deterministic.grade}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.scoreCaption}>Your score</Text>
            <Text style={s.scoreNum}>
              {deterministic.score}
              <Text style={{ fontSize: 11, color: FAINT, fontFamily: "Helvetica" }}> / 100 · {gradeLabel}</Text>
            </Text>
            <View style={s.barTrack}>
              <View style={[s.barFill, { width: `${pct}%`, backgroundColor: gradeColor }]} />
            </View>
            <View style={s.countsRow}>
              <Text style={s.countChip}>{criticalCount} critical</Text>
              <Text style={s.countChip}>{warningCount} to improve</Text>
              <Text style={s.countChip}>{winCount} already good</Text>
            </View>
          </View>
        </View>

        {narrative ? (
          <>
            <Text style={s.sectionTitle}>{narrative.headline}</Text>
            <Text style={s.summary}>{narrative.summary}</Text>

            <Text style={s.sectionTitle}>Top fixes, ranked by impact</Text>
            {narrative.topFixes.map((f, i) => (
              <View key={i} style={s.fix} wrap={false}>
                <Text style={s.fixTitle}>
                  {i + 1}. {f.title}
                </Text>
                <Text style={s.fixWhy}>{f.why}</Text>
                <Text style={s.fixDo}>Do this: {f.do_this}</Text>
              </View>
            ))}
          </>
        ) : null}

        <Text style={s.sectionTitle}>All findings</Text>
        {deterministic.insights.map((ins, i) => (
          <View key={i} style={s.finding} wrap={false}>
            <Text style={[s.sevTag, { backgroundColor: SEVERITY_COLOR[ins.severity] ?? FAINT }]}>
              {SEVERITY_LABEL[ins.severity] ?? "NOTE"}
            </Text>
            <View style={s.findingBody}>
              <Text style={s.findingTitle}>{ins.title}</Text>
              <Text style={s.findingMsg}>{ins.message}</Text>
              <Text style={s.findingAction}>→ {ins.action}</Text>
            </View>
          </View>
        ))}

        <Text style={s.footer} fixed>
          Nemo Local · nemo.local · Generated by the local_visibility_audit skill. Findings are tagged with
          stable rule ids — reply to your report email for the methodology doc or to set up weekly autopilot.
        </Text>
      </Page>
    </Document>
  );

  return await renderToBuffer(doc);
}
