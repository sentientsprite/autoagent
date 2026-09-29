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
  title: "Why mismatched name, address, and phone kill Salt Lake listings | Nemo Local",
  description:
    "Match Name, Address, and Phone on your truck, website, and Google Business Profile before buying more directory listings.",
  path: "/ut/salt-lake-city/contractor-nap-mismatch-citations",
});

const CTA =
  "/?utm_source=pseo&utm_medium=web&utm_campaign=contractor-nap-mismatch-citations&utm_content=google-maps-visibility";

const FAQS = [
  {
    q: "What does Name, Address, and Phone mean?",
    a: "It is the business name, street address, and phone number that must match everywhere — truck door, website footer, and Google Business Profile. People sometimes shorten this to “NAP.”",
  },
  {
    q: "Do I need to be listed in every Salt Lake directory?",
    a: "No. First make Name, Address, and Phone identical on Google and your website. Then fix the directories that already show the wrong number. Buying a bulk listing package before that just spreads the mistake.",
  },
  {
    q: "If my Google phone is wrong, will fixing Yelp alone help?",
    a: "Usually not. Google is the storefront. Fix the Google Business Profile and the website footer first, then update Yelp and other sites so they stop republishing the old number.",
  },
] as const;

export default function ContractorNapMismatchCitationsPage() {
  return (
    <>
      <PseoFaqJsonLd faqs={[...FAQS]} />
      <PseoArticle
        eyebrow="Utah · Contractors · Salt Lake City"
        title="Why mismatched name, address, and phone kill your Salt Lake directory listings"
        lead="Online directories (Yelp, Apple Maps, Bing, industry sites) copy and amplify a wrong phone or address. Match the Name, Address, and Phone on your truck, your website footer, and your Google Business Profile first. Buy more directory listings second."
        ctaHref={CTA}
      
        path="/ut/salt-lake-city/contractor-nap-mismatch-citations"
        hubPath="/ut"
        related={[
          { href: "/ut/salt-lake-city/service-area-gbp-too-vague", title: "Vague service-area profile" },
          { href: "/ut/salt-lake-city/electrician-gbp-website-link", title: "Electrician GBP website link" }
        ]}
      >
        <PseoH2>Plain words first</PseoH2>
        <PseoP>
          <strong>Name, Address, and Phone</strong> (sometimes shortened to NAP) means the exact business name, street
          address, and phone number that must match everywhere a customer might check. Your{" "}
          <strong>Google Business Profile</strong> is the listing that powers Google Maps.{" "}
          <strong>Search engine optimization</strong> (SEO) is the work of getting found in Google. The free{" "}
          <strong>Local Visibility Score</strong> ranks what to fix first — nothing edits your listing unsupervised.
        </PseoP>

        <PseoH2>How it works</PseoH2>
        <PseoP>
          Google and other sites trust you more when Name, Address, and Phone are identical everywhere. That consistency
          is the glue for Maps and for AI Overviews (the answer boxes above the map). One wrong digit on an old Yelp
          page keeps leaking trust even after you fixed Google.
        </PseoP>

        <PseoH2>Three Salt Lake failure modes</PseoH2>
        <PseoUl>
          <li>Old cell number still live on Yelp or Apple Maps after you changed carriers</li>
          <li>Suite or unit number wrong on one site but right on the truck</li>
          <li>“Doing business as” name on the van vs legal name on Google — customers think they found two different shops</li>
        </PseoUl>

        <PseoH2>Fix order</PseoH2>
        <PseoUl>
          <li>Google Business Profile — name, address (or honest service area), phone</li>
          <li>Website footer and contact page — character for character match</li>
          <li>Truck / yard signs</li>
          <li>Then update directories that still show the old number</li>
        </PseoUl>

        <PseoH2>What not to do</PseoH2>
        <PseoP>
          Do not buy a bulk “citations package” before the phone on Google matches the truck. That package will
          republish the wrong number faster.
        </PseoP>

        <PseoH2>FAQ</PseoH2>
        {FAQS.map((f) => (
          <PseoFaq key={f.q} q={f.q} a={f.a} />
        ))}
      </PseoArticle>
    </>
  );
}
