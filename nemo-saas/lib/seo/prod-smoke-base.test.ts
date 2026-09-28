import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const smoke = readFileSync(join(__dirname, "../../scripts/prod-smoke.mjs"), "utf8");

describe("prod-smoke default BASE", () => {
  it("defaults to nemo-app-v-1.vercel.app", () => {
    expect(smoke.includes("https://nemo-app-v-1.vercel.app")).toBe(true);
  });
});
