/**
 * Internal alert when a new wedge lead completes an audit.
 * Goes to LVS_INTERNAL_NOTIFY_EMAIL (sales / founder inbox).
 */
import { Body, Button, Container, Head, Html, Link, Preview, Section, Text } from "@react-email/components";
import React from "react";

export interface LvsInternalEmailProps {
  businessName: string;
  email: string;
  zip: string;
  websiteUrl?: string | null;
  grade: string;
  score: number;
  reportUrl: string;
  topFixTitle?: string | null;
  topFixAction?: string | null;
  leadId: string;
  crmLeadUrl?: string | null;
}

export function LvsInternalEmail({
  businessName,
  email,
  zip,
  websiteUrl,
  grade,
  score,
  reportUrl,
  topFixTitle,
  topFixAction,
  leadId,
  crmLeadUrl,
}: LvsInternalEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`New LVS lead: ${businessName} (${grade}, ${score})`}</Preview>
      <Body style={{ fontFamily: "system-ui, sans-serif", backgroundColor: "#f8fafc", margin: 0 }}>
        <Container style={{ padding: 24, maxWidth: 560, backgroundColor: "#fff" }}>
          <Text style={{ fontSize: 12, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>
            New wedge lead
          </Text>
          <Text style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
            {businessName} — {grade} ({score}/100)
          </Text>
          <Text style={{ color: "#475569", marginTop: 0 }}>
            {email} · ZIP {zip}
            {websiteUrl ? (
              <>
                {" "}
                · <Link href={websiteUrl}>{websiteUrl}</Link>
              </>
            ) : null}
          </Text>

          {topFixTitle ? (
            <Section style={{ padding: 12, backgroundColor: "#f5f3ff", borderRadius: 8, margin: "16px 0" }}>
              <Text style={{ margin: "0 0 4px", fontWeight: 700, color: "#4f46e5", fontSize: 12 }}>#1 fix</Text>
              <Text style={{ margin: 0, fontWeight: 600 }}>{topFixTitle}</Text>
              {topFixAction ? <Text style={{ margin: "6px 0 0", color: "#475569" }}>{topFixAction}</Text> : null}
            </Section>
          ) : null}

          <Section style={{ margin: "20px 0" }}>
            {crmLeadUrl ? (
              <Button
                href={crmLeadUrl}
                style={{
                  backgroundColor: "#4f46e5",
                  color: "#fff",
                  padding: "10px 16px",
                  borderRadius: 8,
                  textDecoration: "none",
                  marginRight: 8,
                }}
              >
                Open in CRM →
              </Button>
            ) : null}
            <Button
              href={reportUrl}
              style={{ backgroundColor: "#0f172a", color: "#fff", padding: "10px 16px", borderRadius: 8, textDecoration: "none" }}
            >
              View PDF report
            </Button>
          </Section>

          <Text style={{ fontSize: 12, color: "#94a3b8" }}>Nemo lead id: {leadId}</Text>
        </Container>
      </Body>
    </Html>
  );
}
