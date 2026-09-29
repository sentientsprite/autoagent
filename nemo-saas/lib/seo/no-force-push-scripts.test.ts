import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const root = join(__dirname, "../..");

describe("no force-push in repo scripts", () => {
  it("scripts/ and ../scripts lack --force push", () => {
    let out = "";
    try {
      out = execFileSync(
        "grep",
        ["-r", "-n", "-E", "push[[:space:]]+--force|push[[:space:]]+-f\\b|--force-with-lease",
          "scripts", "../scripts"],
        { cwd: root, encoding: "utf8" },
      );
    } catch (e: unknown) {
      const err = e as { status?: number; stdout?: string };
      if (err.status === 1) out = "";
      else out = err.stdout ?? "";
    }
    const lines = out.split("\n").filter(Boolean).filter((l) => !l.includes("no-force-push-scripts.test.ts"));
    expect(lines, lines.join("\n")).toEqual([]);
  });
});
