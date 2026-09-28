import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(__dirname, "../../../tasks/_shared/Dockerfile.skill"), "utf8");

describe("Dockerfile.skill", () => {
  it("FROM autoagent-base and prepares /task paths", () => {
    expect(src.includes("FROM autoagent-base")).toBe(true);
    expect(src.includes("/task")).toBe(true);
    expect(src.includes("WORKDIR")).toBe(true);
  });
});
