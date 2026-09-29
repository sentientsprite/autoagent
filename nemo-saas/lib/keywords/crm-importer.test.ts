import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  expandInputToExport,
  flattenTargetKeywords,
  keywordPresenceInsights,
  loadKeywordStrategyExport,
  targetKeywordsFromStrategyExport,
  type KeywordInputData,
  type KeywordPack,
} from "@/lib/keywords/crm-importer";

const template = JSON.parse(
  readFileSync(
    join(__dirname, "../../fixtures/keywords/page-keyword-strategy.template.json"),
    "utf8",
  ),
) as {
  sheets: {
    inputData: {
      topics: { topic: string; urlPath: string | null }[];
      keyphraseBuckets: Record<string, string[]>;
      cityExamplesFromBg: string[];
    };
    crmExport: { exampleRows: KeywordPack["rows"] };
  };
};

describe("page keyword strategy (BG 2-sheet template)", () => {
  it("expands Input Data → Export rows (city × topic)", () => {
    const buckets = template.sheets.inputData.keyphraseBuckets;
    const firstTopic = template.sheets.inputData.topics[0]!;
    const input: KeywordInputData = {
      baseUrl: "https://example.com/",
      cities: ["Millcreek UT", "Salt Lake City UT"],
      topics: [{ topic: firstTopic.topic, urlPath: firstTopic.urlPath ?? undefined }],
      keyphraseBuckets: {
        [firstTopic.topic]: buckets[Object.keys(buckets)[0]!] ?? ["service"],
      },
    };
    const pack = expandInputToExport(input);
    expect(pack.rowCount).toBe(2);
    expect(pack.rows[0]?.topic).toContain("Millcreek UT");
    expect(pack.rows[0]?.keyPhrases[0]).toContain("Millcreek UT");
  });

  it("flattens export example phrases", () => {
    const pack: KeywordPack = {
      rows: template.sheets.crmExport.exampleRows.filter((r) => r.keyPhrases?.length),
    };
    const kws = flattenTargetKeywords(pack, { max: 20 });
    expect(kws.length).toBeGreaterThan(0);
  });

  it("scores on-page presence", () => {
    const pack: KeywordPack = {
      rows: [
        {
          topic: "Concrete Repair Millcreek UT",
          landingUrl: "https://example.com/millcreek-ut/concrete-repair/",
          keyPhrases: ["concrete repair Millcreek UT", "concrete contractor Millcreek UT"],
        },
      ],
    };
    const kws = flattenTargetKeywords(pack);
    const text = "We offer concrete repair Millcreek UT for driveways and foundations.";
    const insights = keywordPresenceInsights(text, kws);
    expect(insights.some((i) => i.id.startsWith("kw."))).toBe(true);
  });

  it("loads strategy export fixture (non-prod API helper)", () => {
    const pack = loadKeywordStrategyExport();
    expect(pack.rows.length).toBeGreaterThan(5);
    const kws = targetKeywordsFromStrategyExport({ max: 15 });
    expect(kws.length).toBeGreaterThan(5);
  });
});
