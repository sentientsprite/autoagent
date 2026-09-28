import type { MetadataRoute } from "next";

import { PUBLIC_BASE, PUBLIC_SITEMAP_PATHS } from "@/lib/seo/public-paths";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-09-28T00:00:00-06:00");
  return PUBLIC_SITEMAP_PATHS.map((path) => ({
    url: `${PUBLIC_BASE}${path}`,
    lastModified,
    changeFrequency: path === "/" || path === "/portal" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path.startsWith("/ut/") || path.startsWith("/id/") ? 0.8 : 0.6,
  }));
}
