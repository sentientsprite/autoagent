import type { Metadata } from "next";

import { PseoArticle, PseoFaq, PseoH2, PseoP, PseoUl } from "../../../_components/PseoArticle";

export const metadata: Metadata = {
  title: "Is AI SEO a second website for Provo HVAC? | Nemo Local",
  description:
    "GEO for Provo HVAC is clearer answers on Maps-ready pages — not a second website. Seasonal Utah demand, proof, FAQ.",
};

const CTA =
  "/?utm_source=pseo&utm_medium=web&utm_campaign=hvac-ai-seo-vs-google-maps&utm_content=google-maps-visibility";

export default function HvacAiSeoPage() {
  return (
    <PseoArticle
      eyebrow="Utah · HVAC · Provo"
      title="Is AI SEO a second website for Provo HVAC shops — or clearer answers?"
      lead="AI SEO is not a second website. For Provo HVAC it is clearer answers on the pages and Google Business Profile you already need for Maps."
      ctaHref={CTA}
    >
      <PseoH2>Maps first</PseoH2>
      <PseoP>
        In 2026 a complete Google Business Profile — right category, full services, fresh photos, recent reviews —
        is one of the inputs Google can draw on for AI Overviews, not only the map pack.
      </PseoP>
      <PseoUl>
        <li>Primary category that matches HVAC (not generic Contractor)</li>
        <li>Services named how people search: AC repair, furnace tune-up, heat pump, duct cleaning</li>
        <li>Fresh job photos from Utah County / Provo neighborhoods you actually serve</li>
        <li>Recent reviews with owner replies</li>
      </PseoUl>

      <PseoH2>Why Provo HVAC pages cite better in-season</PseoH2>
      <PseoP>
        In Utah, both heating and cooling carry real demand, so a seasonal HVAC page that answers before-summer or
        before-winter questions is more citable than a static generic HVAC page.
      </PseoP>

      <PseoH2>GEO checklist after Maps</PseoH2>
      <PseoUl>
        <li>Answer-first H1 and FAQ in buyer language</li>
        <li>Service pages that match GBP services and the phone on the truck</li>
        <li>Proof blocks — named jobs, not adjectives</li>
        <li>NAP match across site footer and Google</li>
        <li>Then worry about AI mentions</li>
      </PseoUl>

      <PseoH2>Evidence</PseoH2>
      <PseoP>
        A named Utah job with a real neighborhood and a real before/after is more citable than another paragraph
        saying you are great. Skip unsourced “X% more calls from AI” claims.
      </PseoP>

      <PseoH2>FAQ</PseoH2>
      <PseoFaq
        q="Is AI SEO a second website?"
        a="No. It is clearer structure on the Maps-ready pages you already need so humans and answer engines can lift honest answers."
      />
      <PseoFaq
        q="Do I need citations in Provo?"
        a="NAP consistency helps. Completeness moves you more than a bulk citation package into a weak listing."
      />
      <PseoFaq
        q="Should I buy 50 AI blog posts first?"
        a="Not before category, phone, services, and the money service page are fixed. Reverse that order and you paid for theater."
      />
    </PseoArticle>
  );
}
