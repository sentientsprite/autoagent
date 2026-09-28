import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const page = readFileSync(
  join(__dirname, "../../app/(marketing)/team/page.tsx"),
  "utf8",
);

describe("team portal indexing", () => {
  it("sets robots index false", () => {
    expect(page.includes("index: false")).toBe(true);
    expect(page.includes("follow: false")).toBe(true);
  });
});
