import type { Metadata } from "next";

import {
  PseoArticle,
  PseoFaq,
  PseoFaqJsonLd,
  PseoH2,
  PseoP,
  PseoUl,
} from "../../../_components/PseoArticle";

export const metadata: Metadata = {
  title: "Vague Google profile? Why Salt Lake service-area shops lose Maps | Nemo Local",
  description:
    "Mobile and service-area businesses: honest cities served, real services, real photos — not a whole-state claim with no proof.",
};

const CTA =
  "/?utm_source=pseo&utm_medium=web&utm_campaign=service-area-gbp-too-vague&utm_content=google-maps-visibility";

const FAQS = [
  {
    q: "What is a service-area business on Google?",
    a: "A business that goes to the customer (mobile plumber, roofer, electrician) instead of a storefront shoppers visit. Google lets you hide the address and list cities or ZIP codes you serve — but those cities should be real work areas, not a padded statewide claim.",
  },
  {
    q: "Should I claim all of Utah as my service area?",
    a: "Only if you truly drive it. Naming Salt Lake City, West Jordan, and Murray with proof jobs beats “entire state of Utah” with empty services and no photos.",
  },
  {
    q: "Will fixing my service area alone put me in the map pack?",
    a: "No. Category, phone match, named services, photos, and review replies still matter. Service area honesty is one completeness lever among several.",
  },
] as const;

export default function ServiceAreaGbpTooVaguePage() {
  return (
    <>
      <PseoFaqJsonLd faqs={[...FAQS]} />
      <PseoArticle
        eyebrow="Utah · Service-area · Salt Lake City"
        title="Mobile / service-area businesses: how a vague Google profile loses the Salt Lake map pack"
        lead="Claiming “whole Utah” with no real jobs in those cities looks like spam. Name the cities you actually drive, list the jobs people search, set the map pin honestly, and keep the Google Business Profile finished."
        ctaHref={CTA}
      >
        <PseoH2>Storefront pin vs service-area</PseoH2>
        <PseoP>
          If customers can visit a shop or yard, use a storefront address pin. If you are truly mobile — you go to their
          driveway — use the service-area setting and list the cities or ZIP codes you cover. Mixing both poorly (hidden
          address plus a statewide radius you never drive) confuses Google and buyers.
        </PseoP>

        <PseoH2>How a vague profile gives you away</PseoH2>
        <PseoUl>
          <li>Empty or vague services (“solutions” instead of drain cleaning, panel upgrade, roof repair)</li>
          <li>Padded radius — whole state or 100+ miles with no neighborhood proof</li>
          <li>No job photos from the Salt Lake valley cities you claim</li>
          <li>Phone on Google that does not match the truck or the website footer</li>
        </PseoUl>

        <PseoH2>Fix first</PseoH2>
        <PseoUl>
          <li>Tighten cities served to places you actually drive this month</li>
          <li>Name real services the way people type them</li>
          <li>Add photos from real ZIP codes; reply to open reviews</li>
          <li>Match Name, Address (or service-area honesty), and Phone across truck / site / Google</li>
        </PseoUl>

        <PseoH2>FAQ</PseoH2>
        {FAQS.map((f) => (
          <PseoFaq key={f.q} q={f.q} a={f.a} />
        ))}
      </PseoArticle>
    </>
  );
}
