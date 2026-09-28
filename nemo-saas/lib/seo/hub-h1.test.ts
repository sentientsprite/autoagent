import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ut = readFileSync(join(__dirname, "../../app/(marketing)/ut/page.tsx"), "utf8");
const id = readFileSync(join(__dirname, "../../app/(marketing)/id/page.tsx"), "utf8");

describe("state hubs render an h1", () => {
  it("utah hub uses hubH1 or <h1", () => {
    expect(ut.includes("hubH1") || ut.includes("<h1")).toBe(true);
  });
  it("idaho hub uses hubH1 or <h1", () => {
    expect(id.includes("hubH1") || id.includes("<h1")).toBe(true);
  });

  it("state hubs use hubMetadata", () => {
    const ut = readFileSync(join(__dirname, "../../app/(marketing)/ut/page.tsx"), "utf8");
    const id = readFileSync(join(__dirname, "../../app/(marketing)/id/page.tsx"), "utf8");
    expect(ut.includes("hubMetadata")).toBe(true);
    expect(id.includes("hubMetadata")).toBe(true);
  });

});
