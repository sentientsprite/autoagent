import { describe, expect, it } from "vitest";

import { classifySupabaseError } from "./errors";

describe("classifySupabaseError", () => {
  it("classifies the production signature (TypeError: fetch failed, status 0) as unreachable_host", () => {
    const c = classifySupabaseError({
      message: "TypeError: fetch failed",
      details:
        "TypeError: fetch failed\n\nCaused by: Error: getaddrinfo ENOTFOUND example.supabase.co (ENOTFOUND)",
      hint: "",
      code: "",
      status: 0,
    });
    expect(c.category).toBe("unreachable_host");
    expect(c.causeCode).toBe("ENOTFOUND");
    expect(c.hint).toMatch(/NEXT_PUBLIC_SUPABASE_URL/);
    expect(c.hint).toMatch(/will NOT fix this layer/);
  });

  it("classifies fetch failure without a status as unreachable_host", () => {
    expect(
      classifySupabaseError({ message: "TypeError: fetch failed" }).category,
    ).toBe("unreachable_host");
  });

  it("classifies a PostgREST schema-cache miss as missing_table", () => {
    const c = classifySupabaseError({
      message: "Could not find the table 'public.leads' in the schema cache",
      code: "PGRST205",
      status: 404,
    });
    expect(c.category).toBe("missing_table");
  });

  it("classifies relation-does-not-exist as missing_table", () => {
    expect(
      classifySupabaseError({
        message: 'relation "public.leads" does not exist',
        code: "42P01",
        status: 500,
      }).category,
    ).toBe("missing_table");
  });

  it("classifies HTTP 401 Invalid API key as invalid_key", () => {
    const c = classifySupabaseError({
      message: "Invalid API key",
      hint: "Double check your Supabase `anon` or `service_role` API key.",
      status: 401,
    });
    expect(c.category).toBe("invalid_key");
  });

  it("leaves constraint violations and null errors as unknown", () => {
    expect(
      classifySupabaseError({
        message: 'duplicate key value violates unique constraint "leads_pkey"',
        code: "23505",
        status: 409,
      }).category,
    ).toBe("unknown");
    expect(classifySupabaseError(null).category).toBe("unknown");
  });
});
