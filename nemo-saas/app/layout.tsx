import type { Metadata } from "next";
import type { ReactNode } from "react";

import { hubMetadata } from "@/lib/seo/pseo-metadata";

const base = hubMetadata({
  title: "Nemo Local — Full Local Visibility Score",
  description:
    "Close-ready LVS for warmer leads and demos: live Google Business Profile lookup, graded scorecard, ranked checklist, and PDF by email.",
  path: "/",
});

export const metadata: Metadata = {
  ...base,
  manifest: "/site.webmanifest",
  other: {
    "theme-color": "#0f172a",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
