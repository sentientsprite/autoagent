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
  title: "Why bigger plumbers beat you on Salt Lake Google Maps | Nemo Local",
  description:
    "Completeness beats brand size on Salt Lake Maps. Category, NAP, services, photos, reviews — then GEO citation eligibility.",
  path: "/ut/salt-lake-city/plumber-google-maps-visibility",
});

const CTA =
  "/?utm_source=pseo&utm_medium=web&utm_campaign=plumber-google-maps-visibility&utm_content=google-maps-visibility";

const FAQS = [
  {
    q: "Why am I not in the map pack?",
    a: "Usually category, distance, completeness, and review freshness — not citations first. Finish the profile before buying directory packages.",
  },
  {
    q: "Do citations fix a weak listing?",
    a: "NAP consistency gets you in the game; profile fields, photos, reviews, and local content move you once you are there. Citations alone will not rescue a wrong category and empty services.",
  },
  {
    q: "Do bigger plumbers automatically rank higher?",
    a: "They look inevitable when listings are finished. You can out-complete a regional competitor on category accuracy, photo freshness, and review replies without matching their ad spend.",
  },
] as const;

export default function PlumberMapsVisibilityPage() {
  return (
    <>
      <PseoFaqJsonLd faqs={[...FAQS]} />
      <PseoArticle
        eyebrow="Utah · Plumbing · Salt Lake City"
        title="Why bigger plumbing companies beat you on Salt Lake Google Maps"
        lead="Bigger Salt Lake plumbing companies do not own the map pack because of brand mythology. They win because the listing is finished: right category, a phone that matches the truck, services named the way people search, photos from real jobs, and reviews that got a human reply."
        ctaHref={CTA}
      
        path="/ut/salt-lake-city/plumber-google-maps-visibility"
        hubPath="/ut"
      >
        <PseoH2>How it works</PseoH2>
        <PseoP>
          In 2026 a complete Google Business Profile — right category, full services, fresh photos, recent reviews —
          is one of the inputs Google can draw on for AI Overviews, not only the map pack. Maps still sends the
          Saturday drain call. AI answers increasingly quote the same complete profiles. Fix the listing once; feed
          both.
        </PseoP>

        <PseoH2>Five reasons you disappear</PseoH2>
        <PseoP>
          Wrong primary category. Pick the most specific honest category first — &quot;Emergency plumber&quot; beats
          &quot;Plumber,&quot; and &quot;HVAC contractor&quot; beats &quot;Contractor&quot; — because the wrong
          primary category can suppress you for the queries that actually pay. Salt Lake example: a shop left on
          generic &quot;Contractor&quot; while a competitor uses &quot;Plumber&quot; will lose relevance on
          clogged-drain searches even with a nicer van wrap.
        </PseoP>
        <PseoP>
          NAP mismatch. NAP consistency gets you in the game; the profile fields, photos, reviews, and local content
          are what move you once you are there. One digit off between the truck, the website footer, and Google, and
          every directory that scraped the old number keeps leaking trust.
        </PseoP>
        <PseoP>
          Empty or vague services. Competitors list drain cleaning, water heater install, slab leak, hydro jetting.
          You list &quot;plumbing solutions.&quot; Name the jobs people type.
        </PseoP>
        <PseoP>
          Stale reviews and silence. Old stars with no owner replies read like abandonment. Same-day ask after
          finished jobs plus replies within a day beat a 2019 review pile.
        </PseoP>
        <PseoP>
          GBP website button to homepage. Homepage sells brand. The button should land on a Salt Lake service page
          that matches the search (drain cleaning, not a slider).
        </PseoP>

        <PseoH2>Fix first</PseoH2>
        <PseoUl>
          <li>Confirm primary category is the most specific honest fit</li>
          <li>Match phone on truck / site / Google</li>
          <li>Add or expand real service names; reply to every open review</li>
          <li>Add real job photos; point GBP website to the strongest service URL</li>
        </PseoUl>

        <PseoH2>FAQ</PseoH2>
        {FAQS.map((f) => (
          <PseoFaq key={f.q} q={f.q} a={f.a} />
        ))}
      </PseoArticle>
    </>
  );
}
