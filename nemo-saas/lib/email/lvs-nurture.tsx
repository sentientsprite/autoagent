/**
 * Day-2 nurture for wedge leads who haven't signed up yet.
 */
import { Body, Button, Container, Head, Html, Link, Preview, Section, Text } from "@react-email/components";
import React from "react";

export interface LvsNurtureEmailProps {
  businessName: string;
  grade: string;
  reportUrl: string;
  topFix?: string | null;
}

export function LvsNurtureEmail({ businessName, grade, reportUrl, topFix }: LvsNurtureEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{`Still thinking about your ${grade} score?`}</Preview>
      <Body style={{ fontFamily: "system-ui, sans-serif", backgroundColor: "#fafafa", margin: 0 }}>
        <Container style={{ padding: 24, maxWidth: 560, backgroundColor: "#fff" }}>
          <Text style={{ fontSize: 12, color: "#666", textTransform: "uppercase" }}>Nemo Local</Text>
          <Text style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            Quick follow-up on {businessName}&apos;s Local Visibility Score
          </Text>
          <Text>
            You got a <strong>{grade}</strong> last week. Most owners in home services fix the top issue within a few
            days and see more map-pack impressions the following week.
          </Text>
          {topFix ? (
            <Section style={{ padding: 12, backgroundColor: "#f5f3ff", borderRadius: 8, margin: "12px 0" }}>
              <Text style={{ margin: 0 }}>Still the highest-impact fix: {topFix}</Text>
            </Section>
          ) : null}
          <Section style={{ margin: "20px 0" }}>
            <Button
              href={reportUrl}
              style={{ backgroundColor: "#4f46e5", color: "#fff", padding: "10px 16px", borderRadius: 8, textDecoration: "none" }}
            >
              Re-open your report
            </Button>
          </Section>
          <Text style={{ color: "#666" }}>
            Want us to run this weekly and fix issues automatically?{" "}
            <Link href="https://nemo-app-v-1.vercel.app/products/beacon">See Beacon</Link> — Local Autopilot from $99/mo.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
