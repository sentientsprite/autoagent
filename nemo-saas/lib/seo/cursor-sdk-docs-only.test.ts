import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const root = join(__dirname, "../..");

describe("CURSOR_SDK not enabled in app code", () => {
  it("lib/app do not set CURSOR_SDK_ENABLED=1", () => {
    let hits: string[] = [];
    try {
      const out = execFileSync(
        "grep",
        ["-r", "-n", "CURSOR_SDK_ENABLED=1", "lib", "app", "scripts", "--include=*.ts", "--include=*.tsx", "--include=*.mjs", "--include=*.js"],
        { cwd: root, encoding: "utf8" },
      );
      hits = out.split("\n").filter(Boolean).filter((l) => !l.includes(".test.ts"));
    } catch (e: unknown) {
      const err = e as { status?: number; stdout?: string };
      if (err.status === 1) hits = [];
      else hits = (err.stdout ?? "").split("\n").filter(Boolean);
    }
    expect(hits).toEqual([]);
  });
});
