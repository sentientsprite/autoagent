import type { Metadata } from "next";

import { pseoMetadata } from "@/lib/seo/pseo-metadata";

import {
  PseoArticle,
  PseoFaq,
  PseoFaqJsonLd,
  PseoH2,
  PseoP,
  PseoUl,
} from "../../../_components/PseoArticle";

export const metadata: Metadata = pseoMetadata({
  title: "Why isn’t my Orem HVAC shop on Google Maps? | Nemo Local",
  description:
    "Utah County heating and air: right category, services named how people search, photos, review replies — then AI citation readiness.",
  path: "/ut/orem/hvac-google-maps-visibility",
});

const CTA =
  "/?utm_source=pseo&utm_medium=web&utm_campaign=hvac-google-maps-visibility&utm_content=google-maps-visibility";

const FAQS = [
  {
    q: "Why am I not showing up on Google Maps in Orem?",
    a: "Usually the category, phone, completeness, and review freshness — not directory listings first. Finish the Google Business Profile before buying more listings.",
  },
  {
    q: "What category should a heating and air shop use?",
    a: "Use the most specific honest fit — typically HVAC contractor — not generic Contractor. Wrong category can hide you on the searches that pay.",
  },
  {
    q: "Do I need to claim all of Utah as my service area?",
    a: "No. Name Orem, Provo, Vineyard, and the cities you actually drive. Padding the whole state with no proof jobs looks like spam.",
  },
] as const;

export default function OremHvacMapsVisibilityPage() {
  return (
    <>
      <PseoFaqJsonLd faqs={[...FAQS]} />
      <PseoArticle
        eyebrow="Utah · Heating & air · Orem / Utah County"
        title="Why isn’t my heating and air shop showing up on Google Maps in Orem / Utah County?"
        lead="Completeness beats brand size on the Utah County map pack. Right category, a phone that matches the truck, AC repair and furnace work named how people search, real job photos, and reviews that got a human reply."
        ctaHref={CTA}
      
        path="/ut/orem/hvac-google-maps-visibility"
        hubPath="/ut"
        related={[
          { href: "/ut/ogden/roofer-google-review-replies", title: "Ogden review replies" },
          { href: "/ut/salt-lake-city/plumber-google-maps-visibility", title: "Salt Lake plumber Maps" }
        ]}
      >
        <PseoH2>How it works</PseoH2>
        <PseoP>
          In 2026 a complete Google Business Profile — right category, full services, fresh photos, recent reviews —
          is one of the inputs Google can draw on for AI Overviews (the answer boxes above the map), not only the map
          pack. Fix the listing once; feed both Maps and AI answers.
        </PseoP>

        <PseoH2>Five reasons you disappear</PseoH2>
        <PseoP>
          Wrong primary category. Generic &quot;Contractor&quot; loses to &quot;HVAC contractor&quot; on furnace and AC
          searches. Utah County example: left on Contractor while a competitor uses HVAC contractor — you lose relevance
          even with a nicer van wrap.
        </PseoP>
        <PseoP>
          Phone mismatch. One digit off between the truck, the website footer, and Google, and every Orem / Provo
          directory that scraped the old number keeps leaking trust.
        </PseoP>
        <PseoP>
          Vague services. Competitors list AC repair, furnace tune-up, heat pump, duct cleaning. You list &quot;HVAC
          solutions.&quot; Name the jobs people type.
        </PseoP>
        <PseoP>
          Stale reviews and silence. Old stars with no owner replies read like abandonment. Ask the same day the job
          finishes; reply within about a day.
        </PseoP>
        <PseoP>
          Google Business Profile website button pointed at the homepage. Homepage sells brand. The button should land
          on an Orem / Utah County service page that matches the search.
        </PseoP>

        <PseoH2>Utah County seasonal angle</PseoH2>
        <PseoP>
          Before June heat, people search AC repair. Before winter inversion cold, they search furnace tune-up. Pages
          and profile services that answer those timing questions with real neighborhood proof (Orem, Provo, Vineyard)
          beat a static generic HVAC blurb and a statewide service-area claim you never drive.
        </PseoP>

        <PseoH2>Fix first</PseoH2>
        <PseoUl>
          <li>Set primary category to HVAC contractor (or the most specific honest fit)</li>
          <li>Match phone on truck / site / Google</li>
          <li>Name AC repair, furnace, heat pump, duct work — reply to every open review</li>
          <li>Add real Utah County job photos; point the Google website button to your strongest service page</li>
        </PseoUl>

        <PseoH2>FAQ</PseoH2>
        {FAQS.map((f) => (
          <PseoFaq key={f.q} q={f.q} a={f.a} />
        ))}
      </PseoArticle>
    </>
  );
}
