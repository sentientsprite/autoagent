import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PUBLIC_ARTICLE_PATHS, PUBLIC_HUB_PATHS } from "./public-paths";

const smoke = readFileSync(join(__dirname, "../../scripts/prod-smoke.mjs"), "utf8");

describe("prod-smoke ROUTES coverage", () => {
  it("lists every PUBLIC_ARTICLE_PATH", () => {
    for (const path of PUBLIC_ARTICLE_PATHS) {
      expect(smoke.includes(`"${path}"`) || smoke.includes(`'${path}'`), path).toBe(true);
    }
  });

  it("lists every PUBLIC_HUB_PATH", () => {
    for (const path of PUBLIC_HUB_PATHS) {
      // homepage appears as "/" in ROUTES
      expect(smoke.includes(`"${path}"`) || smoke.includes(`'${path}'`), path).toBe(true);
    }
  });
});
