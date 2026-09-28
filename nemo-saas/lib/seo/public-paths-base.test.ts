import { describe, expect, it } from "vitest";
import { PUBLIC_BASE, PUBLIC_SITEMAP_PATHS } from "./public-paths";

describe("PUBLIC_BASE", () => {
  it("is https production host", () => {
    expect(PUBLIC_BASE.startsWith("https://")).toBe(true);
    expect(PUBLIC_BASE.includes("nemo-app-v-1.vercel.app")).toBe(true);
    expect(PUBLIC_BASE.endsWith("/")).toBe(false);
  });

  it("sitemap path count stays 17 overnight", () => {
    expect(PUBLIC_SITEMAP_PATHS.length).toBe(17);
  });
});
