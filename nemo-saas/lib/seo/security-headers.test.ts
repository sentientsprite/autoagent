import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const cfg = readFileSync(join(__dirname, "../../next.config.mjs"), "utf8");

describe("next.config security headers", () => {
  it("sets nosniff DENY referrer and permissions-policy", () => {
    expect(cfg.includes("X-Content-Type-Options")).toBe(true);
    expect(cfg.includes("nosniff")).toBe(true);
    expect(cfg.includes("X-Frame-Options")).toBe(true);
    expect(cfg.includes("DENY")).toBe(true);
    expect(cfg.includes("Referrer-Policy")).toBe(true);
    expect(cfg.includes("strict-origin-when-cross-origin")).toBe(true);
    expect(cfg.includes("Permissions-Policy")).toBe(true);
    expect(cfg.includes("camera=()")).toBe(true);
  });

  it("registers headers() for all paths", () => {
    expect(cfg.includes("async headers()")).toBe(true);
    expect(cfg.includes("/:path*")).toBe(true);
  });
});
