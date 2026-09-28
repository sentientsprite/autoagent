import { describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const root = join(__dirname, "../..");

function grep(pattern: string, path: string): string[] {
  try {
    return execFileSync("grep", ["-r", "-n", "-E", pattern, path, "--include=*.ts", "--include=*.tsx"], {
      cwd: root,
      encoding: "utf8",
    })
      .split("\n")
      .filter(Boolean)
      .filter((l) => !l.includes("no-presence-cdp-marketing.test.ts"));
  } catch (e: unknown) {
    const err = e as { status?: number; stdout?: string };
    if (err.status === 1) return [];
    return (err.stdout ?? "").split("\n").filter(Boolean);
  }
}

describe("no presence/CDP in marketing app", () => {
  it("app/(marketing) has no chrome.debugger / CDP / puppeteer stealth markers", () => {
    const hits = [
      ...grep("chrome\\.debugger|puppeteer-extra|stealthPlugin|CDP_ENDPOINT", "app/(marketing)"),
    ];
    expect(hits).toEqual([]);
  });
});
