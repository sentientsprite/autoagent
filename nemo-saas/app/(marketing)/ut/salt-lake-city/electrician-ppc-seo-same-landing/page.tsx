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
  title: "Should PPC and SEO share the same Salt Lake electrician landing? | Nemo Local",
  description:
    "Yes for intent match — one URL per search intent, same phone as GBP, fix the listing before raising bids. No invented ROAS.",
  path: "/ut/salt-lake-city/electrician-ppc-seo-same-landing",
});

const CTA =
  "/?utm_source=pseo&utm_medium=web&utm_campaign=electrician-ppc-seo-same-landing&utm_content=google-maps-visibility";

const FAQS = [
  {
    q: "Should PPC and SEO share the same landing page?",
    a: "Yes when the search intent matches. One final URL per intent; same phone as GBP. Ads into a weak listing or homepage still lose.",
  },
  {
    q: "Should I split brand vs service ads?",
    a: "Often yes at the campaign level — but each ad group still needs a matching money URL. Brand ads can use a brand page; service ads need the service page, not the homepage.",
  },
  {
    q: "Do citations fix a bad landing?",
    a: "No. Citations help NAP consistency. A weak final URL and unfinished GBP still waste spend after the click.",
  },
] as const;

export default function ElectricianPpcSeoSameLandingPage() {
  return (
    <>
      <PseoFaqJsonLd faqs={[...FAQS]} />
      <PseoArticle
        eyebrow="Utah · Electrical · Salt Lake City"
        title="Should PPC and SEO for Salt Lake electricians share the same landing page?"
        lead="Yes for intent match. Ads into a weak listing or homepage still lose. One URL per search intent, the same phone as GBP, and fix the profile before you raise bids — no invented ROAS or CPC theater."
        ctaHref={CTA}
      >
        <PseoH2>Ads into a weak GBP = paid waste</PseoH2>
        <PseoP>
          Paid clicks that land on a brand homepage or a profile with wrong category, mismatched phone, and empty
          services do not become booked jobs. SEO and PPC both need the same complete Salt Lake service URL when the
          query is the same intent.
        </PseoP>

        <PseoH2>One final URL per intent</PseoH2>
        <PseoP>
          Panel upgrade search → panel upgrade Salt Lake page. EV charger search → EV charger page. Keep NAP identical
          across Ads final URL, site footer, and Google. Split brand vs service campaigns if you want — still do not
          send service ads to the homepage.
        </PseoP>

        <PseoH2>Fix order before raising bids</PseoH2>
        <PseoUl>
          <li>Primary category — most specific honest electrician fit</li>
          <li>Phone match truck / site / Google</li>
          <li>Services named how people search</li>
          <li>Money page live and set as GBP website + Ads final URL</li>
          <li>Then raise bids</li>
        </PseoUl>

        <PseoH2>What not to do</PseoH2>
        <PseoP>
          Do not invent ROAS, CPC, or &quot;X% more booked jobs&quot; claims. Rank gaps with a free Local Visibility
          Score, align Ads final URL to the same money page, then measure from your own account.
        </PseoP>

        <PseoH2>FAQ</PseoH2>
        {FAQS.map((f) => (
          <PseoFaq key={f.q} q={f.q} a={f.a} />
        ))}
      </PseoArticle>
    </>
  );
}
