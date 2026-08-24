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
  "nemo/site.report.monthly": {
    data: { siteId: string; orgId: string };
  };
  "nemo/site.brief.weekly": {
    data: { siteId: string; orgId: string; weekStart?: string };
  };
  "nemo/lead.wedge.followup": {
    data: {
      leadId: string;
      email: string;
      businessName: string;
      grade: string;
      reportUrl: string;
      topFixAction: string | null;
    };
  };
  "nemo/content.drafts.weekly": {
    data: {
      orgId?: string;
      weekStart?: string;
    };
  };
};

export const inngest = new Inngest({
  id: "nemo-saas",
  schemas: new EventSchemas().fromRecord<Events>(),
});

export type NemoEvent = keyof Events;
