import { Suspense } from "react";

import HomeClient from "./HomeClient";

export default function MarketingHomePage() {
  return (
    <Suspense
      fallback={
        <main style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
          <p style={{ color: "#666" }}>Loading…</p>
        </main>
      }
    >
      <HomeClient />
    </Suspense>
  );
}
