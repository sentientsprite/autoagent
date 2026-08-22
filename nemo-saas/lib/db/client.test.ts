import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: async () => ({ getAll: () => [], set: () => {} }),
}));

const ENV_KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;
const ORIGINAL_ENV = { ...process.env };

function setEnv(over: Partial<Record<(typeof ENV_KEYS)[number], string>>) {
  for (const k of ENV_KEYS) {
    const v = over[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

function fakeJwt(role: string): string {
  return ["header", Buffer.from(JSON.stringify({ role })).toString("base64url"), "sig"].join(".");
}

beforeEach(() => vi.resetModules());
afterEach(() => {
  for (const k of ENV_KEYS) {
    const v = ORIGINAL_ENV[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

describe("dbAsService env validation", () => {
  it("throws naming NEXT_PUBLIC_SUPABASE_URL when it is unset", async () => {
    setEnv({ SUPABASE_SERVICE_ROLE_KEY: fakeJwt("service_role") });
    const { dbAsService } = await import("./client");
    expect(() => dbAsService()).toThrowError(/NEXT_PUBLIC_SUPABASE_URL is not set/);
  });

  it("throws naming SUPABASE_SERVICE_ROLE_KEY when it is unset", async () => {
    setEnv({ NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co" });
    const { dbAsService } = await import("./client");
    expect(() => dbAsService()).toThrowError(/SUPABASE_SERVICE_ROLE_KEY is not set/);
  });

  it("fails fast on a URL missing the scheme", async () => {
    setEnv({
      NEXT_PUBLIC_SUPABASE_URL: "no-scheme-host.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: fakeJwt("service_role"),
    });
    const { dbAsService } = await import("./client");
    expect(() => dbAsService()).toThrowError(/missing http\(s\):\/\/ scheme/);
  });

  it("fails fast on an unparseable URL", async () => {
    setEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://",
      SUPABASE_SERVICE_ROLE_KEY: fakeJwt("service_role"),
    });
    const { dbAsService } = await import("./client");
    expect(() => dbAsService()).toThrowError(/not a parseable URL/);
  });

  it("rejects an anon JWT used as the service key", async () => {
    setEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: fakeJwt("anon"),
    });
    const { dbAsService } = await import("./client");
    expect(() => dbAsService()).toThrowError(/anon key/);
  });

  it("builds a client for a well-formed URL + service_role JWT", async () => {
    setEnv({
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: fakeJwt("service_role"),
    });
    const { dbAsService } = await import("./client");
    expect(typeof dbAsService().from).toBe("function");
  });

  it("trims surrounding whitespace on the URL", async () => {
    setEnv({
      NEXT_PUBLIC_SUPABASE_URL: "  https://example.supabase.co  ",
      SUPABASE_SERVICE_ROLE_KEY: fakeJwt("service_role"),
    });
    const { dbAsService } = await import("./client");
    expect(() => dbAsService()).not.toThrow();
  });
});

describe("parseSupabaseUrl", () => {
  it("returns a URL for a valid value", async () => {
    const { parseSupabaseUrl } = await import("./client");
    expect(parseSupabaseUrl("https://example.supabase.co").hostname).toBe("example.supabase.co");
  });

  it("accepts http://localhost for local dev", async () => {
    const { parseSupabaseUrl } = await import("./client");
    expect(parseSupabaseUrl("http://localhost:54321").port).toBe("54321");
  });
});
