import type { Metadata } from "next";
import Link from "next/link";

import { ActivateFoundingClient } from "./ActivateFoundingClient";

export const metadata: Metadata = {
  title: "Billing success | Nemo Local",
  description: "Founding plan activation after Checkout (mock-safe).",
};

export default async function BillingSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const orgId = typeof sp.org === "string" ? sp.org : "";
  const sessionId =
    typeof sp.session_id === "string"
      ? sp.session_id
      : typeof sp.sessionId === "string"
        ? sp.sessionId
        : "";
  const mock = sp.mock_checkout === "1" || sessionId.startsWith("cs_mock_");

  return (
    <main
      style={{
        maxWidth: 560,
        margin: "48px auto",
        padding: "0 20px",
        fontFamily: "system-ui, sans-serif",
        color: "#1a1a1a",
      }}
    >
      <p style={{ fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", color: "#666" }}>
        Nemo Local · Money Farm
      </p>
      <h1 style={{ fontSize: 28, margin: "8px 0 12px" }}>Checkout complete</h1>
      <p style={{ lineHeight: 1.5, color: "#333" }}>
        {mock
          ? "Mock Checkout — no charge. Activating Founding ($199 · ≤5 locations) on this org."
          : "Activating Founding plan on your org. Live Stripe webhook still syncs subscription ids."}
      </p>
      {orgId ? (
        <ActivateFoundingClient orgId={orgId} sessionId={sessionId || undefined} mode={mock ? "mock" : "live"} />
      ) : (
        <p style={{ color: "#b45309" }}>Missing org id. Use /billing/success?org=&lt;uuid&gt;.</p>
      )}
      <p style={{ marginTop: 32 }}>
        <Link href="/portal" style={{ color: "#0f766e" }}>
          Back to portal
        </Link>
      </p>
    </main>
  );
}
