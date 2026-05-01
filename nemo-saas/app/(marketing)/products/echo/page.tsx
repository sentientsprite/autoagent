import type { Metadata } from "next";

import { BulletList, ProductChrome } from "../ProductChrome";

export const metadata: Metadata = {
  title: "Echo — Review Flywheel | Nemo Local",
  description:
    "Job-completion triggered review requests, tailored replies, and testimonial amplification — Echo add-on.",
};

export default function EchoProductPage() {
  return (
    <ProductChrome sku="Add-on · Echo" title="Turn finished jobs into a steady review pipeline" priceLine="$89/mo">
      <BulletList
        items={[
          "Trigger — webhook from invoicing, parsed completion email, or a simple “Job done” signal.",
          "Request — SMS or email review asks with a direct Google link; capped so customers never feel spammed.",
          "Response — reply drafts that reference technician, service, and context.",
          "Amplifier — sentiment trends, surface issues to the owner, spin strong reviews into testimonial graphics.",
        ]}
      />
      <p style={{ fontSize: 15, color: "#444", lineHeight: 1.55 }}>
        Best when you already complete dozens of jobs monthly: trades, dental, legal, hospitality — anywhere stars and
        velocity drive calls.
      </p>
    </ProductChrome>
  );
}
