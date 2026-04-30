/**
 * Lead-facing email after the wedge audit completes. Plain HTML rendered via
 * react-email so we can swap in real components later without re-plumbing.
 */
import { Body, Button, Container, Head, Html, Link, Preview, Section, Text } from "@react-email/components";
import React from "react";

export interface LvsEmailProps {
  businessName: string;
  grade: string;
  reportUrl: string;
  topFix?: string;
}

export function LvsEmail({ businessName, grade, reportUrl, topFix }: LvsEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Your Local Visibility Score: ${grade}`}</Preview>
      <Body style={{ fontFamily: "system-ui, sans-serif", backgroundColor: "#fafafa", margin: 0 }}>
        <Container style={{ padding: 24, maxWidth: 560, backgroundColor: "#fff" }}>
          <Text style={{ fontSize: 12, color: "#666", textTransform: "uppercase" }}>Nemo Local</Text>
          <Text style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            {businessName} — Local Visibility Score: {grade}
          </Text>
          <Text>
            Your full report (PDF) is attached. The single biggest issue we found:
          </Text>
          {topFix ? (
            <Section style={{ padding: 12, backgroundColor: "#f7f7f8", borderRadius: 4, margin: "12px 0" }}>
              <Text style={{ margin: 0 }}>{topFix}</Text>
            </Section>
          ) : null}
          <Section style={{ margin: "20px 0" }}>
            <Button
              href={reportUrl}
              style={{ backgroundColor: "#111", color: "#fff", padding: "10px 16px", borderRadius: 4, textDecoration: "none" }}
            >
              View report online
            </Button>
          </Section>
          <Text style={{ color: "#666" }}>
            If you'd like us to fix these for you, hit reply or check out{" "}
            <Link href="https://nemo.local/local-autopilot">Local Autopilot</Link> ($99/mo).
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
