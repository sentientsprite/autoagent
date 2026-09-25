import type { Metadata } from "next";

import { PseoArticle, PseoFaq, PseoH2, PseoP, PseoUl } from "../../../_components/PseoArticle";

export const metadata: Metadata = {
  title: "Does one Google review a week beat a burst? Salt Lake roofers | Nemo Local",
  description:
    "Review velocity vs historic star piles for Salt Lake roofers. Steady drip, replies, complete GBP — then GEO.",
};

const CTA =
  "/?utm_source=pseo&utm_medium=web&utm_campaign=roofer-google-review-velocity&utm_content=google-maps-visibility";

export default function RooferReviewVelocityPage() {
  return (
    <PseoArticle
      eyebrow="Utah · Roofing · Salt Lake City"
      title="Does one Google review a week beat a big burst for Salt Lake roofers?"
      lead="A steady drip of fresh Google reviews usually beats a one-time burst that goes quiet. Recency is the signal."
      ctaHref={CTA}
    >
      <PseoH2>Why review velocity matters</PseoH2>
      <PseoP>
        In 2026 a complete Google Business Profile — right category, full services, fresh photos, recent reviews —
        is one of the inputs Google can draw on for AI Overviews, not only the map pack. Reviews are one layer of
        that completeness.
      </PseoP>

      <PseoH2>Freshness vs historic star pile</PseoH2>
      <PseoP>
        A shop getting a few new reviews most months usually outlasts a competitor with a big stack of reviews from
        years ago. One review a week is a useful operating target — not a magic number. The point is consistency,
        not a burst that never repeats.
      </PseoP>

      <PseoH2>How to run velocity without faking it</PseoH2>
      <PseoUl>
        <li>Same-day ask after completed jobs with a direct Google review link</li>
        <li>Reply within 48 hours — thank-yous and calm specifics on hard reviews</li>
        <li>Do not treat a one-time review push as a replacement for steady fresh reviews</li>
        <li>Keep services and photos current so new reviews land on a finished listing</li>
      </PseoUl>

      <PseoH2>NAP / citations</PseoH2>
      <PseoP>
        NAP consistency gets you in the game; profile fields, photos, reviews, and local content move you once you
        are there. Citations that disagree with your Google phone fight the trust story your new reviews are
        building.
      </PseoP>

      <PseoH2>FAQ</PseoH2>
      <PseoFaq
        q="Does one review a week beat a burst?"
        a="A steady drip usually outlasts a one-time pile that goes quiet. Burst campaigns without an ongoing ask leave the profile looking frozen again."
      />
      <PseoFaq
        q="Do citations fix review velocity?"
        a="No. Citations help NAP consistency. Velocity comes from finished jobs plus a same-day ask plus replies."
      />
      <PseoFaq
        q="Will LVS change my reviews for me?"
        a="No. Local Visibility Score ranks gaps and emails a checklist/PDF. You stay in control of the profile."
      />
    </PseoArticle>
  );
}
