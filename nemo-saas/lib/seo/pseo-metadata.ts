import type { Metadata } from "next";

import { PUBLIC_BASE } from "./public-paths";

export function pseoMetadata(opts: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = `${PUBLIC_BASE}${opts.path}`;
  return {
    title: opts.title,
    description: opts.description,
    alternates: { canonical: url },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url,
      siteName: "Nemo Local",
      type: "article",
      locale: "en_US",
    },
    twitter: {
      card: "summary",
      title: opts.title,
      description: opts.description,
    },
  };
}

export function hubMetadata(opts: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const base = pseoMetadata(opts);
  return {
    ...base,
    openGraph: {
      ...(typeof base.openGraph === "object" ? base.openGraph : {}),
      type: "website",
    },
  };
}
