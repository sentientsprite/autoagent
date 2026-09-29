import { describe, expect, it } from "vitest";
import { insightsToActionItems } from "./action-items";
import type { Insight } from "@/lib/skills/_shared/rule-engine";

describe("insightsToActionItems", () => {
  it("maps critical profile_incomplete to do_first with checklist steps", () => {
    const insights: Insight[] = [
      {
        id: "gbp.profile_incomplete",
        severity: "critical",
        title: "Google Business Profile is incomplete",
        message: "Missing: phone.",
        action: "Fill phone.",
        evidence: { missing: "phone" },
      },
    ];
    const items = insightsToActionItems(insights);
    expect(items).toHaveLength(1);
    expect(items[0]?.priority).toBe("do_first");
    expect(items[0]?.steps.length).toBeGreaterThanOrEqual(2);
    expect(items[0]?.steps.some((s) => /phone/i.test(s.label))).toBe(true);
  });

  it("maps win severity to keep_going", () => {
    const insights: Insight[] = [
      {
        id: "gbp.local_presence_ok",
        severity: "win",
        title: "Present",
        message: "ok",
        action: "keep",
      },
    ];
    const items = insightsToActionItems(insights);
    expect(items[0]?.priority).toBe("keep_going");
  });
});
