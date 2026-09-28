import { describe, expect, it } from "vitest";
import { hubMetadata, pseoMetadata } from "./pseo-metadata";

describe("pseoMetadata", () => {
  it("sets canonical and og url from path", () => {
    const m = pseoMetadata({
      title: "T | Nemo Local",
      description: "D".repeat(80),
      path: "/ut/demo",
    });
    expect(m.alternates?.canonical).toBe("https://nemo-app-v-1.vercel.app/ut/demo");
    expect((m.openGraph as { url?: string }).url).toBe("https://nemo-app-v-1.vercel.app/ut/demo");
    expect((m.openGraph as { type?: string }).type).toBe("article");
    expect((m.twitter as { card?: string }).card).toBe("summary");
  });

  it("description is non-trivial length", () => {
    const m = pseoMetadata({
      title: "T | Nemo Local",
      description: "D".repeat(80),
      path: "/ut/demo",
    });
    expect(String(m.description).length).toBeGreaterThanOrEqual(50);
  });

  it("twitter title mirrors page title", () => {
    const m = pseoMetadata({
      title: "T | Nemo Local",
      description: "D".repeat(80),
      path: "/ut/demo",
    });
    expect((m.twitter as { title?: string }).title).toBe("T | Nemo Local");
  });

  it("openGraph siteName is Nemo Local", () => {
    const m = pseoMetadata({
      title: "T | Nemo Local",
      description: "D".repeat(80),
      path: "/ut/demo",
    });
    expect((m.openGraph as { siteName?: string }).siteName).toBe("Nemo Local");
  });

  it("openGraph locale is en_US", () => {
    const m = pseoMetadata({
      title: "T | Nemo Local",
      description: "D".repeat(80),
      path: "/ut/demo",
    });
    expect((m.openGraph as { locale?: string }).locale).toBe("en_US");
  });
});

describe("hubMetadata", () => {
  it("uses website og type", () => {
    const m = hubMetadata({ title: "Hub", description: "D".repeat(80), path: "/ut" });
    expect((m.openGraph as { type?: string }).type).toBe("website");
  });

  it("hubMetadata sets canonical for path", () => {
    const m = hubMetadata({ title: "Hub", description: "D".repeat(80), path: "/portal" });
    expect(m.alternates?.canonical).toBe("https://nemo-app-v-1.vercel.app/portal");
  });
});
