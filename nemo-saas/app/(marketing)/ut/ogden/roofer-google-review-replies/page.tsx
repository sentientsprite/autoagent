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
  title: "Ogden roofers: do ignored Google reviews hurt Maps? | Nemo Local",
  description:
    "Weber County roofing: reply to Google reviews. Stars without answers look abandoned — same-day ask, reply within about two days.",
};

const CTA =
  "/?utm_source=pseo&utm_medium=web&utm_campaign=roofer-google-review-replies&utm_content=google-maps-visibility";

const FAQS = [
  {
    q: "Do I lose Google Maps trust if I ignore reviews?",
    a: "Silence reads like abandonment. A lower star average with steady owner replies usually looks healthier than a 2019 five-star pile with no answers since.",
  },
  {
    q: "How fast should I reply?",
    a: "Aim for about two days. Same-day is better after a finished roof job. Thank them, name the work if honest, and invite them to call if something is wrong.",
  },
  {
    q: "Is this the same as getting more reviews?",
    a: "Related but different. Asking for new reviews is velocity. Answering the ones you already have is reply hygiene. Do both — do not invent percentages.",
  },
] as const;

export default function OgdenRooferReviewRepliesPage() {
  return (
    <>
      <PseoFaqJsonLd faqs={[...FAQS]} />
      <PseoArticle
        eyebrow="Utah · Roofing · Ogden / Weber County"
        title="Do Ogden / Weber County roofers lose Google Maps trust when they ignore reviews?"
        lead="Star ratings without owner replies look abandoned. Ask the same day the job finishes; reply within about two days. That beats a pile of old five-star reviews from 2019 with silence since."
        ctaHref={CTA}
      >
        <PseoH2>Why replies matter</PseoH2>
        <PseoP>
          In 2026 a complete Google Business Profile — right category, full services, fresh photos, recent reviews —
          feeds both the map pack and AI Overviews (answer boxes). Reviews are one layer. Freshness plus a human reply
          signals you still own the listing.
        </PseoP>

        <PseoH2>Storm season in northern Utah</PseoH2>
        <PseoP>
          After wind and hail, Ogden and Weber County shops get a surge of reviews — good and bad. Owners who go silent
          for weeks look closed. Competitors who thank every customer and fix complaints in public look open for the next
          storm call.
        </PseoP>

        <PseoH2>Fix first</PseoH2>
        <PseoUl>
          <li>Reply to every open Google review within about two days</li>
          <li>Ask for a review the same day the job is finished — text a direct Google link</li>
          <li>Keep category, phone, and services finished so new reviews land on a complete profile</li>
          <li>Do not buy fake reviews; do not invent “X% more calls” claims</li>
        </PseoUl>

        <PseoH2>FAQ</PseoH2>
        {FAQS.map((f) => (
          <PseoFaq key={f.q} q={f.q} a={f.a} />
        ))}
      </PseoArticle>
    </>
  );
}
