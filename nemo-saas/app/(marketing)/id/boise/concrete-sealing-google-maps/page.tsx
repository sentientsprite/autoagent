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
  title: "Why isn’t my Boise concrete sealing showing on Google Maps? | Nemo Local",
  description:
    "Treasure Valley map pack: category, NAP, sealing/staining services named how people search, job photos, review replies — then GEO.",
  path: "/id/boise/concrete-sealing-google-maps",
});

const CTA =
  "/?utm_source=pseo&utm_medium=web&utm_campaign=concrete-sealing-google-maps&utm_content=google-maps-visibility";

const FAQS = [
  {
    q: "Why am I not in the map pack?",
    a: "Usually category, distance, completeness, and review freshness — not citations first. Finish the Boise profile before buying directory packages.",
  },
  {
    q: "Do I need citations in Boise?",
    a: "NAP consistency gets you in the game across Treasure Valley directories. Completeness — category, services, photos, replies — moves you more than a bulk citation dump into a weak listing.",
  },
  {
    q: "Service-area vs storefront pin?",
    a: "If you have a real yard or shop customers can visit, use a storefront pin. If you are truly mobile across Meridian / Nampa / Eagle, use service-area honestly — do not pad a whole-state radius you never drive.",
  },
] as const;

export default function BoiseConcreteSealingMapsPage() {
  return (
    <>
      <PseoFaqJsonLd faqs={[...FAQS]} />
      <PseoArticle
        eyebrow="Idaho · Concrete · Boise / Treasure Valley"
        title="Why isn’t my concrete sealing business showing up on Google Maps in Boise?"
        lead="Completeness beats brand size in the Treasure Valley map pack. Right category, a phone that matches the truck, sealing and staining named the way people search, job photos from real Boise-area pours, and reviews that got a human reply."
        ctaHref={CTA}
      
        path="/id/boise/concrete-sealing-google-maps"
        hubPath="/id"
        related={[
          { href: "/ut/salt-lake-city/electrician-gbp-website-link", title: "Electrician GBP website link" },
          { href: "/ut/salt-lake-city/contractor-nap-mismatch-citations", title: "Name/address/phone match" }
        ]}
      >
        <PseoH2>How it works</PseoH2>
        <PseoP>
          In 2026 a complete Google Business Profile — right category, full services, fresh photos, recent reviews —
          is one of the inputs Google can draw on for AI Overviews, not only the map pack. Maps still sends the
          driveway-seal call. AI answers increasingly quote the same complete profiles. Fix the listing once; feed
          both.
        </PseoP>

        <PseoH2>Five reasons you disappear</PseoH2>
        <PseoP>
          Wrong primary category. Generic &quot;Contractor&quot; loses to &quot;Concrete contractor&quot; (or the most
          specific honest fit) on sealing and staining queries. Boise example: a shop left on Contractor while a
          competitor uses Concrete contractor will lose relevance even with a nicer truck wrap.
        </PseoP>
        <PseoP>
          NAP mismatch. One digit off between the truck, the website footer, and Google, and every Meridian / Nampa
          directory that scraped the old number keeps leaking trust.
        </PseoP>
        <PseoP>
          Vague services. Competitors list concrete sealing, staining, driveway overlay, garage floor epoxy. You list
          &quot;concrete solutions.&quot; Name the jobs people type.
        </PseoP>
        <PseoP>
          Stale reviews and silence. Old stars with no owner replies read like abandonment. Same-day ask after finished
          jobs plus replies within a day beat a 2019 review pile.
        </PseoP>
        <PseoP>
          GBP website button to homepage. Homepage sells brand. The button should land on a Boise sealing/staining
          service page that matches the search — not a slider.
        </PseoP>

        <PseoH2>Boise / Treasure Valley angle</PseoH2>
        <PseoP>
          Neighborhood honesty beats whole-state padding. If you actually serve Meridian, Nampa, and Eagle, say so with
          proof jobs. Do not claim statewide Idaho coverage you never drive — Maps and buyers both punish the lie.
        </PseoP>

        <PseoH2>Fix first</PseoH2>
        <PseoUl>
          <li>Confirm primary category is Concrete contractor (or the most specific honest fit)</li>
          <li>Match phone on truck / site / Google</li>
          <li>Name sealing, staining, overlay, epoxy — reply to every open review</li>
          <li>Add real Treasure Valley job photos; point GBP website to the strongest sealing URL</li>
        </PseoUl>

        <PseoH2>FAQ</PseoH2>
        {FAQS.map((f) => (
          <PseoFaq key={f.q} q={f.q} a={f.a} />
        ))}
      </PseoArticle>
    </>
  );
}
