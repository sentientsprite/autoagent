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
  title: "Should my Salt Lake electrician GBP link to homepage or a service page? | Nemo Local",
  description:
    "Service page. Homepage sells brand; the Google profile website button should land on the job people searched.",
  path: "/ut/salt-lake-city/electrician-gbp-website-link",
});

const CTA =
  "/?utm_source=pseo&utm_medium=web&utm_campaign=electrician-gbp-website-link&utm_content=google-maps-visibility";

const FAQS = [
  {
    q: "Homepage or service page on the GBP website button?",
    a: "Service page. Match the primary intent you want from Maps — panel upgrade, EV charger, lighting — not a brand homepage.",
  },
  {
    q: "Do I need a separate page for every service?",
    a: "Start with the one money job that matches your primary category and GBP services list. Expand after category, phone, and that page are solid.",
  },
  {
    q: "Will fixing the link alone put me in the map pack?",
    a: "No. Wrong category, NAP drift, empty services, and dead reviews still suppress you. The website button is one completeness lever among several.",
  },
] as const;

export default function ElectricianGbpWebsiteLinkPage() {
  return (
    <>
      <PseoFaqJsonLd faqs={[...FAQS]} />
      <PseoArticle
        eyebrow="Utah · Electrical · Salt Lake City"
        title="Should my Salt Lake electrician Google profile link to the homepage or a service page?"
        lead="Service page. Homepage sells brand. The GBP website button should land on the job people searched — panel upgrade, EV charger, outdoor lighting — with Salt Lake proof and the same phone as the truck."
        ctaHref={CTA}
      
        path="/ut/salt-lake-city/electrician-gbp-website-link"
        hubPath="/ut"
      >
        <PseoH2>Answer first</PseoH2>
        <PseoP>
          Point the Google Business Profile website button at a Salt Lake service URL, not the homepage. Maps visitors
          already chose a trade intent; dumping them on a brand slider wastes the click and weakens what AI Overviews
          can quote from a complete profile.
        </PseoP>

        <PseoH2>Anatomy of the service page</PseoH2>
        <PseoUl>
          <li>Local hook — Salt Lake / valley neighborhoods you actually serve</li>
          <li>Services-in-city named how people search (panel upgrade, EV charger, rewire, lighting)</li>
          <li>Proof jobs — named installs, not adjectives</li>
          <li>FAQ in buyer language</li>
          <li>NAP match + click-to-call identical to GBP</li>
        </PseoUl>

        <PseoH2>Match GBP services to the page H1</PseoH2>
        <PseoP>
          If the profile lists EV charger install and panel upgrade, the landing H1 and first screen should say those
          words — not &quot;electrical solutions.&quot; Category accuracy still comes first; a wrong primary category
          can suppress you even with a perfect money page.
        </PseoP>

        <PseoH2>Check today</PseoH2>
        <PseoUl>
          <li>Open your GBP → Website — does it hit homepage or a Salt Lake service URL?</li>
          <li>Confirm phone on that page matches Google and the truck</li>
          <li>Align GBP services list with the page H1</li>
          <li>Then run a free Local Visibility Score to rank remaining gaps</li>
        </PseoUl>

        <PseoH2>FAQ</PseoH2>
        {FAQS.map((f) => (
          <PseoFaq key={f.q} q={f.q} a={f.a} />
        ))}
      </PseoArticle>
    </>
  );
}
