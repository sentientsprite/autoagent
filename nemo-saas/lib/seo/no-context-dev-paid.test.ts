import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const root = join(__dirname, "../..");

function grep(pattern: string): string[] {
  try {
    const out = execFileSync(
      "grep",
      ["-r", "-n", "-E", pattern, "lib", "app", "scripts", "--include=*.ts", "--include=*.tsx", "--include=*.js", "--include=*.mjs"],
      { cwd: root, encoding: "utf8" },
    );
    return out.split("\n").filter(Boolean).filter((l) => !l.includes("no-context-dev-paid.test.ts"));
  } catch (e: unknown) {
    const err = e as { status?: number; stdout?: string };
    if (err.status === 1) return [];
    return (err.stdout ?? "").split("\n").filter(Boolean);
  }
}

describe("no paid Context.dev", () => {
  it("lib/app/scripts do not reference context.dev API keys", () => {
    expect(grep("context\\.dev|CONTEXT_DEV_API|CONTEXTDEV")).toEqual([]);
  });
});
