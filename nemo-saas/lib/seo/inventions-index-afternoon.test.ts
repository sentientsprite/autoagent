import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(
  join(process.env.HOME || "", "Projects/build-assistant/workflows/nemo-dayshift-inventions-index-2026-09-28.md"),
  "utf8",
);

describe("inventions index afternoon section", () => {
  it("lists afternoon reconnect invents and hard-stop never list", () => {
    expect(src.includes("Afternoon reconnect") || src.includes("reconnect")).toBe(true);
    expect(src.includes("CURSOR_SDK") || src.includes("Stripe LIVE")).toBe(true);
    expect(src.includes("Never:") || src.includes("force-push")).toBe(true);
  });
});
