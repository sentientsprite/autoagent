import { writeFileSync } from "node:fs";
import { renderLvsReportPdf } from "../lib/pdf/lvs-report.tsx";

const deterministic = {
  grade: "B",
  score: 84,
  insights: [
    { id: "gbp.photos_low", severity: "warning", title: "Only 2 photos on your Google Business Profile", message: "Listings with 10+ photos get ~2x more direction requests.", action: "Upload 8 geo-tagged photos of recent jobs." },
    { id: "reviews.velocity", severity: "warning", title: "Review velocity is slowing", message: "1 review in the last 90 days vs 4 the prior quarter.", action: "Text your last 10 customers a review link." },
    { id: "nap.consistent", severity: "win", title: "Name/address/phone is consistent", message: "Your NAP matches across the directories we checked.", action: "Keep it consistent when you update anything." },
    { id: "hours.complete", severity: "win", title: "Business hours are complete", message: "All 7 days listed, including holiday hours.", action: "Review seasonally." },
    { id: "gbp.found", severity: "win", title: "Google Business Profile found and verified", message: "Your listing is live and matched on the first try.", action: "Nothing to do here." },
    { id: "site.localpage", severity: "critical", title: "No location page for your top service area", message: "We couldn't find a dedicated page targeting your main city.", action: "Publish a service-area landing page." },
  ],
  evidence: { placeFound: true, rating: 4.7, reviewCount: 22, photoCount: 2, napDirectoriesChecked: 4 },
};

const narrative = {
  headline: "Strong profile, a few high-impact gaps",
  summary:
    "Your Google Business Profile is verified and your NAP is clean — that's the hard part done. The biggest lever right now is content: more recent photos and a dedicated location page would move you from page-two to the local pack for your main service area.",
  topFixes: [
    { insightId: "gbp.photos_low", title: "Add 8 recent job photos", why: "Photo-rich listings earn ~2x the direction requests.", do_this: "Upload geo-tagged before/after photos from your last 8 jobs." },
    { insightId: "site.localpage", title: "Publish a location page for your main city", why: "Google rewards locally-relevant pages in the map pack.", do_this: "Create /service-areas/<city> with reviews, photos, and a clear CTA." },
    { insightId: "reviews.velocity", title: "Restart review velocity", why: "Recent reviews weigh more than old ones.", do_this: "Text your last 10 customers a one-tap review link this week." },
  ],
};

const pdf = await renderLvsReportPdf({
  businessName: "Wasatch Peak HVAC",
  zip: "84003",
  deterministic,
  narrative,
  generatedAt: new Date("2026-06-27"),
});
writeFileSync("/tmp/lvs-preview.pdf", pdf);
console.log("wrote /tmp/lvs-preview.pdf", pdf.byteLength, "bytes");
