import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as access from "./access-directory";

const portal = readFileSync(join(__dirname, "../app/(marketing)/portal/page.tsx"), "utf8");

describe("access-directory customer hygiene", () => {
  it("exports github map for team only (object exists)", () => {
    expect(access.github.trunk).toContain("github.com");
  });

  it("portal page does not embed raw github.com trunk URL", () => {
    expect(portal.includes(access.github.trunk)).toBe(false);
  });
});
