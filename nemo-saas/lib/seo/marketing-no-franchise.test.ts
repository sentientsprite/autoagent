import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const root = join(__dirname, "../..");

describe("marketing franchise CLEAN", () => {
  it("app/(marketing) has no franchise copy", () => {
    let hits: string[] = [];
    try {
      const out = execFileSync(
        "grep",
        ["-r", "-n", "-i", "franchise", "app/(marketing)", "--include=*.ts", "--include=*.tsx", "--include=*.md", "--include=*.mdx"],
        { cwd: root, encoding: "utf8" },
      );
      hits = out.split("\n").filter(Boolean);
    } catch (e: unknown) {
      const err = e as { status?: number; stdout?: string };
      if (err.status === 1) hits = [];
      else hits = (err.stdout ?? "").split("\n").filter(Boolean);
    }
    expect(hits).toEqual([]);
  });
});
