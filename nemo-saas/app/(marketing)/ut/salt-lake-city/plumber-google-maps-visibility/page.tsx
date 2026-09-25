import type { Metadata } from "next";

import { PseoArticle, PseoFaq, PseoH2, PseoP, PseoUl } from "../../../_components/PseoArticle";

export const metadata: Metadata = {
  title: "Why bigger plumbers beat you on Salt Lake Google Maps | Nemo Local",
  description:
    "Completeness beats brand size on Salt Lake Maps. Category, NAP, services, photos, reviews — then GEO citation eligibility.",
};

const CTA =
  "/?utm_source=pseo&utm_medium=web&utm_campaign=plumber-google-maps-visibility&utm_content=google-maps-visibility";

export default function PlumberMapsVisibilityPage() {
  return (
    <PseoArticle
      eyebrow="Utah · Plumbing · Salt Lake City"
      title="Why bigger plumbing companies beat you on Salt Lake Google Maps"
      lead="Bigger Salt Lake plumbing companies do not own the map pack because of brand mythology. They win because the listing is finished."
      ctaHref={CTA}
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
        Wrong primary category. Pick the most specific honest category first — Emergency plumber beats Plumber —
        because the wrong primary category can suppress you for the queries that actually pay.
      </PseoP>
      <PseoP>
        NAP mismatch. Consistency gets you in the game; profile fields, photos, reviews, and local content move
        you once you are there. Match phone character for character across truck, site, and Google.
      </PseoP>
      <PseoP>
        Empty or vague services. Competitors list drain cleaning, water heater install, slab leak, hydro jetting.
        You list plumbing solutions. Name the jobs people type.
      </PseoP>
      <PseoP>
        Stale reviews and silence. Same-day ask after finished jobs plus replies within a day beat a 2019 review
        pile.
      </PseoP>
      <PseoP>
        GBP website button to homepage. Homepage sells brand. The button should land on a Salt Lake service page
        that matches the search.
      </PseoP>

      <PseoH2>Fix first</PseoH2>
      <PseoUl>
        <li>Confirm primary category is the most specific honest fit</li>
        <li>Match phone on truck / site / Google</li>
        <li>Add real service names and reply to open reviews</li>
        <li>Add real job photos; point GBP to the strongest service URL</li>
      </PseoUl>

      <PseoH2>FAQ</PseoH2>
      <PseoFaq
        q="Why am I not in the map pack?"
        a="Usually category, distance, completeness, and review freshness — not citations first. Finish the profile before buying directory packages."
      />
      <PseoFaq
        q="Do citations fix a weak listing?"
        a="NAP consistency gets you in the game. Completeness moves you. Citations alone will not rescue a wrong category and empty services."
      />
      <PseoFaq
        q="Do bigger plumbers automatically rank higher?"
        a="They look inevitable when listings are finished. You can out-complete a regional competitor on category, photos, and replies without matching ad spend."
      />
    </PseoArticle>
  );
}
