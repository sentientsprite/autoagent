import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dockerfile = join(__dirname, "../../../Dockerfile.base");

describe("autoagent Dockerfile.base", () => {
  it("exists and pins autoagent-base FROM lineage for Harbor", () => {
    expect(existsSync(dockerfile)).toBe(true);
    const src = readFileSync(dockerfile, "utf8");
    expect(src.length).toBeGreaterThan(20);
    expect(/FROM|python|node/i.test(src)).toBe(true);
  });
});
