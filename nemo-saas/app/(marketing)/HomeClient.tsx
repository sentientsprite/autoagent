"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

interface AuditResponse {
  ok: boolean;
  grade: string;
  score: number;
  reportUrl: string;
  error?: string;
}

/** Fake scorecard for screenshots: open `/` with `?demo=post-submit`. */
const DEMO_RESULT: AuditResponse = {
  ok: true,
  grade: "B+",
  score: 84,
  reportUrl: "https://example.com/sample-local-visibility-report.pdf",
};

export default function HomeClient() {
  const searchParams = useSearchParams();
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<AuditResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const demo = searchParams.get("demo");
    if (demo === "post-submit") {
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
        ok?: boolean;
        error?: string;
        detail?: string;
        hint?: string;
      };
      if (!res.ok || !json.ok) {
        const parts = [json.error, json.detail, json.hint].filter(Boolean);
        throw new Error(parts.join(" — ") || "Audit failed");
      }
      setResult(json as AuditResponse);
    } catch (err) {
      setError(String(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <main style={mainStyle}>
      <section style={heroStyle}>
        <p style={brandStyle}>NEMO LOCAL</p>
        <h1 style={h1Style}>Free Local Visibility Score for home-services businesses.</h1>
        <p style={subStyle}>
          Tell us your business name and ZIP. In under a minute we&apos;ll grade your Google Business Profile,
          review velocity, and listing consistency, and email you a one-page PDF with the top 3 fixes.
        </p>

        <form onSubmit={onSubmit} style={formStyle}>
          <input name="businessName" placeholder="Business name" required style={inputStyle} />
          <input name="zip" placeholder="ZIP" required pattern="\d{5}" style={inputStyle} />
          <input name="websiteUrl" placeholder="Website (optional)" type="url" style={inputStyle} />
          <input name="email" placeholder="Email" required type="email" style={inputStyle} />
          <button type="submit" disabled={pending} style={btnStyle}>
            {pending ? "Auditing..." : "Get my score"}
          </button>
        </form>

        {error ? <p style={{ color: "#c62828", marginTop: 12 }}>{error}</p> : null}

        {result ? (
          <div style={resultStyle}>
            <p style={{ fontSize: 12, color: "#666", textTransform: "uppercase" }}>Your score</p>
            <p style={{ fontSize: 56, fontWeight: 700, lineHeight: 1, margin: "4px 0" }}>{result.grade}</p>
            <p>{result.score} / 100</p>
            <a href={result.reportUrl} target="_blank" rel="noreferrer" style={linkStyle}>
              Open the full report (PDF) →
            </a>
            <p style={{ marginTop: 16, fontSize: 13, color: "#555" }}>
              Ready for weekly GBP autopilot?{" "}
              <Link href="/products/beacon" style={{ color: "#111", fontWeight: 600 }}>
                See Beacon →
              </Link>
            </p>
          </div>
        ) : null}
      </section>
    </main>
  );
}

const mainStyle: React.CSSProperties = { fontFamily: "system-ui, sans-serif", padding: 24 };
const heroStyle: React.CSSProperties = { maxWidth: 560, margin: "48px auto" };
const brandStyle: React.CSSProperties = { fontSize: 12, color: "#666", letterSpacing: 1 };
const h1Style: React.CSSProperties = { fontSize: 36, lineHeight: 1.1, margin: "8px 0 16px" };
const subStyle: React.CSSProperties = { color: "#444", marginBottom: 24 };
const formStyle: React.CSSProperties = { display: "grid", gap: 8 };
const inputStyle: React.CSSProperties = { padding: "10px 12px", border: "1px solid #ddd", borderRadius: 4, fontSize: 14 };
const btnStyle: React.CSSProperties = {
  padding: "12px 16px",
  border: "none",
  borderRadius: 4,
  background: "#111",
  color: "#fff",
  fontSize: 14,
  cursor: "pointer",
};
const resultStyle: React.CSSProperties = { marginTop: 32, padding: 24, background: "#f7f7f8", borderRadius: 4 };
const linkStyle: React.CSSProperties = { display: "inline-block", marginTop: 12, color: "#111" };
