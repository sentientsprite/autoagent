import type { Metadata } from "next";

import { BulletList, ProductChrome } from "../ProductChrome";

export const metadata: Metadata = {
  title: "Beacon — GBP Autopilot | Nemo Local",
  description:
    "Weekly GBP monitoring, posts, review replies, and citation fixes — scoped add-on for multi-location home services.",
};

export default function BeaconProductPage() {
  return (
    <ProductChrome
      sku="Add-on · Beacon"
      title="GBP Autopilot for maps-heavy businesses"
      priceLine="From $129/mo per location · +$79/mo each extra location"
    >
      <BulletList
        items={[
          "Monitor — local-pack rank signals, competitor GBP moves, Q&A worth answering.",
          "Optimizer — drafted GBP posts, photo refreshes, category and attribute tweaks.",
          "Review — personalized reply drafts in your brand voice; sequences that ask for reviews after great jobs.",
          "Citation — scan and fix directory inconsistencies that confuse Google and callers.",
        ]}
      />
      <p style={{ fontSize: 15, color: "#444", lineHeight: 1.55 }}>
        Built for teams that live on Google Maps: HVAC, plumbing, landscaping, dental, and other high-intent local
        verticals. Human approval before anything publishes — same gate your agency already uses.
      </p>
    </ProductChrome>
  );
}
