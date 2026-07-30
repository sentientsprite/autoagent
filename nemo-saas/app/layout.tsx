import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Nemo Local — Full Local Visibility Score",
  description:
    "Close-ready LVS for warmer leads and demos: live Google Business Profile lookup, graded scorecard, ranked checklist, and PDF by email.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
