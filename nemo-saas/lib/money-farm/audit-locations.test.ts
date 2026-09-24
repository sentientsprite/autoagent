import { describe, expect, it } from "vitest";

import { auditLocations } from "@/lib/money-farm/audit-locations";

describe("auditLocations dryRun", () => {
  it("caps and stubs without network", async () => {
    const { cappedTo, results } = await auditLocations({
      plan: "local_autopilot",
      dryRun: true,
      locations: [
        { businessName: "A", city: "Boulder" },
        { businessName: "B", city: "Denver" },
        { businessName: "C", city: "Fort Collins" },
        { businessName: "D", city: "Colorado Springs" },
        { businessName: "E", city: "Aurora" },
        { businessName: "F", city: "Lakewood" },
      ],
    });
    expect(cappedTo).toBe(5);
    expect(results).toHaveLength(5);
    expect(results.every((r) => r.ok && r.score === 70)).toBe(true);
  });
});
