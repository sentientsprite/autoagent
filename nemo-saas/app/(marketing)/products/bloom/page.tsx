import type { Metadata } from "next";

import { BulletList, ProductChrome } from "../ProductChrome";

export const metadata: Metadata = {
  title: "Bloom — Seasonal Content Engine | Nemo Local",
  description:
    "Rolling 90-day calendar, drafted posts and blogs, visuals, and distribution — Bloom add-on for seasonal local brands.",
};

export default function BloomProductPage() {
  return (
    <ProductChrome
      sku="Add-on · Bloom"
      title="Seasonal content that matches weather, events, and intent"
      priceLine="$249/mo · +$99/mo per extra channel beyond default bundle"
    >
      <BulletList
        items={[
          "Planner — 90-day calendar tied to seasonality, local events, and high-intent keywords.",
          "Creator — Google Posts, social captions, and longer service-area articles drafted for approval.",
          "Visual — before/after and seasonal graphics aligned to campaigns.",
          "Distributor — publish or queue across GBP, blog, and approved socials.",
          "Performance — engagement and ranking feedback informs the next planning cycle.",
        ]}
      />
      <p style={{ fontSize: 15, color: "#444", lineHeight: 1.55 }}>
        Anchor SKU when visuals and seasonality sell the work: landscaping, remodelers, roofers, and retailers with
        recurring hooks year-round.
      </p>
    </ProductChrome>
  );
}
