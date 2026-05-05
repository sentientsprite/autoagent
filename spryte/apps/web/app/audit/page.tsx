"use client";

import { useMemo, useState } from "react";

import type { FreeAuditResult } from "@spryte/auditor";

type ApiOk = { ok: true; result: FreeAuditResult };

function ScoreBar({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl bg-panel p-4 ring-1 ring-line">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-mist">{label}</p>
          {hint ? <p className="mt-2 text-xs text-white/65">{hint}</p> : null}
        </div>
        <p className="font-mono text-2xl tabular-nums text-signal">{value.toFixed(1)}</p>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-gradient-to-r from-signal/40 to-signal"
          style={{ width: `${Math.round((value / 10) * 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function AuditPage() {
  const [url, setUrl] = useState("");
  const [city, setCity] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [payload, setPayload] = useState<FreeAuditResult | null>(null);

  const averages = useMemo(() => {
    if (!payload) return null;
    const s = payload.scores;
    const avg = (s.gbp + s.seo + s.mobile + s.content + s.reviews) / 5;
    return { avg };
  }, [payload]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setPayload(null);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          city: city.trim() ? city.trim() : undefined,
          businessName: businessName.trim() ? businessName.trim() : undefined,
        }),
      });

      const dataUnknown: unknown = await res.json();

      const asObj =
        typeof dataUnknown === "object" && dataUnknown !== null
          ? (dataUnknown as { ok?: unknown; error?: unknown; result?: unknown })
          : null;

      if (!asObj || !("ok" in asObj)) {
        throw new Error("Unexpected response");
      }

      if (asObj.ok === false) {
        throw new Error("Validation failed — check URL and optional fields.");
      }

      const data = dataUnknown as ApiOk;

      setPayload(data.result);
    } catch {
      setError("Audit failed — check your URL and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-10 space-y-3">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-signal">Lead magnet · free audit</p>
        <h1 className="text-4xl font-semibold text-white">Instant visibility audit</h1>
        <p className="max-w-2xl leading-relaxed text-mist">
          Paste a URL. We crawl with PinchTab when available (with a plain fetch fallback), then score GBP signals, SEO,
          mobile, content, and reviews — with no login.
        </p>
      </div>

      <form onSubmit={onSubmit} className="rounded-2xl bg-panel p-6 shadow-glow ring-1 ring-line">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="md:col-span-2">
            <span className="font-mono text-xs uppercase tracking-wider text-mist">Business website</span>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
              placeholder="https://example.com"
              className="mt-2 w-full rounded-lg bg-void px-3 py-3 font-mono text-sm text-white ring-1 ring-line outline-none placeholder:text-white/35 focus:ring-signal/40"
            />
          </label>

          <label>
            <span className="font-mono text-xs uppercase tracking-wider text-mist">City (optional)</span>
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="West Jordan"
              className="mt-2 w-full rounded-lg bg-void px-3 py-3 font-mono text-sm text-white ring-1 ring-line outline-none placeholder:text-white/35 focus:ring-signal/40"
            />
          </label>

          <label>
            <span className="font-mono text-xs uppercase tracking-wider text-mist">Business name (optional)</span>
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Monkey Wrench Plumbing"
              className="mt-2 w-full rounded-lg bg-void px-3 py-3 font-mono text-sm text-white ring-1 ring-line outline-none placeholder:text-white/35 focus:ring-signal/40"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-signal/15 px-4 py-3 font-mono text-sm text-signal ring-1 ring-signal/40 transition hover:bg-signal/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Generate scorecard"}
          </button>

          <p className="text-xs text-white/55">
            Target: {"<"}30s • Model: Claude Haiku (API) • MLX fallback on local port 8000
          </p>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg bg-danger/10 px-3 py-2 font-mono text-sm text-danger ring-1 ring-danger/35">
            {error}
          </p>
        ) : null}
      </form>

      {payload ? (
        <section className="mt-10 space-y-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="font-mono text-xs uppercase tracking-wider text-mist">Report</p>
              <p className="text-2xl font-semibold text-white">{payload.scores.headline ?? "Audit complete"}</p>
              <p className="text-sm text-white/65">
                {payload.url}{" "}
                <span className="mx-2 text-white/35">/</span>
                provider {payload.model.provider}{" "}
                <span className="mx-2 text-white/35">/</span>
                {payload.model.latencyMs.toFixed(0)}ms • est ${payload.model.estimatedCostUsd.toFixed(4)}
              </p>
              {averages ? (
                <p className="font-mono text-sm text-white/75">
                  composite <span className="text-signal">{averages.avg.toFixed(1)}</span> / 10
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <ScoreBar label="Google Business Profile" value={payload.scores.gbp} />
            <ScoreBar label="SEO" value={payload.scores.seo} />
            <ScoreBar label="Mobile" value={payload.scores.mobile} />
            <ScoreBar label="Content" value={payload.scores.content} />
            <ScoreBar label="Reputation / reviews" value={payload.scores.reviews} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl bg-panel p-5 ring-1 ring-line">
              <p className="font-mono text-xs uppercase tracking-wider text-mist">Highlights</p>
              <ul className="mt-3 space-y-2">
                {(payload.scores.highlights ?? []).map((item) => (
                  <li key={item} className="leading-relaxed text-white/80">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-panel p-5 ring-1 ring-line">
              <p className="font-mono text-xs uppercase tracking-wider text-mist">Next moves</p>
              <ul className="mt-3 space-y-2">
                {(payload.scores.actions ?? []).map((item) => (
                  <li key={item} className="leading-relaxed text-white/80">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl bg-panel p-5 ring-1 ring-line">
            <p className="font-mono text-xs uppercase tracking-wider text-mist">Evidence</p>
            <p className="mt-2 text-sm leading-relaxed text-white/65">
              PinchTab: {payload.evidence.pinchTab ? "yes" : "no"} · Direct fetch fallback:{" "}
              {payload.evidence.directFetch ? "yes" : "no"}
            </p>
            {payload.evidence.notes?.length ? (
              <ul className="mt-3 space-y-2 text-sm text-amber">
                {payload.evidence.notes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="rounded-2xl bg-gradient-to-r from-signal/15 to-transparent p-6 ring-1 ring-signal/35">
            <p className="font-mono text-xs uppercase tracking-wider text-signal">Growth plan</p>
            <p className="mt-3 max-w-2xl leading-relaxed text-white/85">
              Want SPRYTE running weekly with human approvals before anything goes live? Book the Starter audit — GBP
              monitoring, weekly digest, plain-English next steps — built for Salt Lake County service businesses.
            </p>
          </div>
        </section>
      ) : null}
    </main>
  );
}
