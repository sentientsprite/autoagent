import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-full max-w-3xl flex-col gap-10 px-6 py-16">
      <header className="space-y-3">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-signal">SPRYTE</p>
        <h1 className="text-4xl font-semibold text-white md:text-5xl">Mission control for local growth</h1>
        <p className="max-w-xl text-base leading-relaxed text-mist">
          Connect your GBP, website, and ads — route every customer-touch through human approval gates. Start with an
          instant audit for free.
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/audit"
          className="inline-flex items-center gap-2 rounded-lg bg-signal/10 px-4 py-3 font-mono text-sm text-signal shadow-glow ring-1 ring-signal/35 transition hover:bg-signal/15"
        >
          Run free audit
          <span aria-hidden>→</span>
        </Link>
      </div>
    </main>
  );
}
