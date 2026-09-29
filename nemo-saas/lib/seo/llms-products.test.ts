import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const llms = readFileSync(join(__dirname, "../../public/llms.txt"), "utf8");

describe("llms.txt products", () => {
  it("mentions Beacon Echo Bloom under Optional/Product", () => {
    expect(llms).toMatch(/Beacon/);
    expect(llms).toMatch(/Echo/);
    expect(llms).toMatch(/Bloom/);
    expect(llms).toMatch(/\/products\//);
  });
});
