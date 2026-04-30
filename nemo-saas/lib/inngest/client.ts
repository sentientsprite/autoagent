import { Inngest, EventSchemas } from "inngest";

import type { JobKind } from "@/lib/db/types";

type Events = {
  "nemo/job.requested": {
    data: {
      jobId: string;
      orgId: string;
      siteId: string | null;
      kind: JobKind;
    };
  };
  "nemo/lvs.requested": {
    data: {
      leadId: string;
      jobId: string;
      businessName: string;
      zip: string;
      websiteUrl?: string;
      email: string;
    };
  };
  "nemo/site.report.monthly": {
    data: { siteId: string; orgId: string };
  };
};

export const inngest = new Inngest({
  id: "nemo-saas",
  schemas: new EventSchemas().fromRecord<Events>(),
});

export type NemoEvent = keyof Events;
