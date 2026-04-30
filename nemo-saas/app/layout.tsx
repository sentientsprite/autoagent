import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Nemo Local — Local Visibility Score for home services",
  description:
    "Free 60-second audit of your Google Business Profile, reviews, and listings. PDF emailed.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
