import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "../../app/(marketing)/HomeClient.tsx"), "utf8");

describe("HomeClient", () => {
  it("mentions Local Visibility Score", () => {
    expect(/Local Visibility Score/i.test(src)).toBe(true);
  });
});
