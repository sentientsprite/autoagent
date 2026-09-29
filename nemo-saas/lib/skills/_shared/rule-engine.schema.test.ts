import { describe, expect, it } from "vitest";

import { schemaInsights } from "./rule-engine";

describe("schemaInsights", () => {
  it("flags missing LocalBusiness schema", () => {
    const out = schemaInsights({
      hasSchemaLocalBusiness: false,
      websiteUrl: "https://example.com",
    });
    expect(out.map((i) => i.id)).toEqual(["schema.localbusiness_missing"]);
    expect(out[0]?.severity).toBe("warning");
  });

  it("records win when schema present", () => {
    const out = schemaInsights({
      hasSchemaLocalBusiness: true,
      websiteUrl: "https://example.com",
    });
    expect(out.map((i) => i.id)).toEqual(["schema.localbusiness_ok"]);
    expect(out[0]?.severity).toBe("win");
  });
});
