import type { MetadataRoute } from "next";

import { PUBLIC_BASE } from "@/lib/seo/public-paths";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/team", "/hq/", "/billing/"],
      },
    ],
    sitemap: `${PUBLIC_BASE}/sitemap.xml`,
    host: PUBLIC_BASE,
  };
}
