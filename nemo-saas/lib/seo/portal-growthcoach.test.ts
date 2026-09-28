import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const portal = readFileSync(join(__dirname, "../../app/(marketing)/portal/page.tsx"), "utf8");
const access = readFileSync(join(__dirname, "../access-directory.ts"), "utf8");

describe("portal GrowthCoach install wiring", () => {
  it("portal imports growthCoach helpers", () => {
    expect(portal.includes("growthCoachInstallUrl")).toBe(true);
    expect(portal.includes("growthCoachInstallLabel")).toBe(true);
  });

  it("access-directory exports install helpers", () => {
    expect(access.includes("growthCoachInstallUrl")).toBe(true);
    expect(access.includes("growthCoachInstallLabel")).toBe(true);
  });
});
