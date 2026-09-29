import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const raw = readFileSync(join(__dirname, "../../vercel.json"), "utf8");
const cfg = JSON.parse(raw);

describe("vercel.json", () => {
  it("uses nextjs framework with npm ci + npm run build", () => {
    expect(cfg.framework).toBe("nextjs");
    expect(cfg.installCommand).toBe("npm ci");
    expect(cfg.buildCommand).toBe("npm run build");
  });
});
