import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PUBLIC_ARTICLE_PATHS } from "./public-paths";

const root = join(__dirname, "../..");
const ut = readFileSync(join(root, "app/(marketing)/ut/page.tsx"), "utf8");
const id = readFileSync(join(root, "app/(marketing)/id/page.tsx"), "utf8");
const portal = readFileSync(join(root, "app/(marketing)/portal/page.tsx"), "utf8");

describe("hub/portal link coverage for public articles", () => {
  it("Utah hub lists every /ut article path", () => {
    for (const p of PUBLIC_ARTICLE_PATHS.filter((x) => x.startsWith("/ut/"))) {
      expect(ut.includes(p), p).toBe(true);
    }
  });

  it("Idaho hub lists every /id article path", () => {
    for (const p of PUBLIC_ARTICLE_PATHS.filter((x) => x.startsWith("/id/"))) {
      expect(id.includes(p), p).toBe(true);
    }
  });

  it("portal references every public article path", () => {
    for (const p of PUBLIC_ARTICLE_PATHS) {
      expect(portal.includes(p), p).toBe(true);
    }
  });

  it("portal links product pages", () => {
    for (const p of ["/products/beacon", "/products/bloom", "/products/echo"]) {
      expect(portal.includes(p), p).toBe(true);
    }
  });

});
