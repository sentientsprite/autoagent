import { describe, expect, it } from "vitest";
import { Input, runDeterministic } from "./index";
import type { GscQueryRow } from "@/lib/connectors/google";

describe("gsc_opportunity_finder Input + edges", () => {
  it("fills defaults for startDate/endDate/rowLimit", () => {
    const parsed = Input.parse({});
    expect(parsed.startDate).toBe("90daysAgo");
    expect(parsed.endDate).toBe("today");
    expect(parsed.rowLimit).toBe(5000);
  });

  it("rejects rowLimit above max", () => {
    expect(() => Input.parse({ rowLimit: 50_000 })).toThrow();
  });

  it("returns empty opportunities for empty rows", async () => {
    const out = await runDeterministic({ rows: [] as GscQueryRow[] });
    expect(out.opportunities).toEqual([]);
    expect(out.totalRows).toBe(0);
  });
});
