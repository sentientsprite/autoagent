import { describe, expect, it } from "vitest";
import { stubResult, stubRun } from "./stub";

describe("skill stub helpers", () => {
  it("stubResult marks not_implemented with kind/milestone", () => {
    const r = stubResult("reputation_loop", "M-JUN-15", "Echo launch");
    expect(r.deterministic.not_implemented).toBe(true);
    expect(r.deterministic.kind).toBe("reputation_loop");
    expect(r.deterministic.milestone).toBe("M-JUN-15");
    expect(r.deterministic.eta_note).toContain("Echo");
  });

  it("stubRun throws NonRetriable-style not_implemented_yet", () => {
    expect(() => stubRun("paid_qa", "M-JUL-01", "later")).toThrow(/not_implemented_yet:paid_qa/);
  });
});
