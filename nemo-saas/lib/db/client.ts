import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Structural validation for NEXT_PUBLIC_SUPABASE_URL. Fail fast at first use
 * with an error that names the variable and the defect, instead of letting
 * the request die later inside the SDK as an opaque "TypeError: fetch failed".
 * Never echoes the configured value — only describes the defect.
 */
export function parseSupabaseUrl(raw: string | undefined): URL {
  if (!raw || !raw.trim()) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is not set. Add it to .env.local and the Vercel project env " +
        "(expected https://<project-ref>.supabase.co, or http://localhost:54321 for local dev).",
    );
  }
  const trimmed = raw.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is malformed: missing http(s):// scheme. " +
        "Expected https://<project-ref>.supabase.co (or http://localhost:54321 for local dev).",
    );
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL is malformed: not a parseable URL. " +
        "Expected https://<project-ref>.supabase.co (or http://localhost:54321 for local dev).",
    );
  }
  if (!parsed.hostname) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is malformed: empty hostname.");
  }
  return parsed;
}

function assertServiceRoleKey(key: string): void {
  const parts = key.split(".");
  if (parts.length < 2) return;
  try {
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const payload = JSON.parse(atob(padded)) as { role?: string };
    if (payload.role === "anon") {
      throw new Error(
        "SUPABASE_SERVICE_ROLE_KEY is the anon key. Use the service_role secret from Supabase → Project Settings → API.",
      );
    }
  } catch (e) {
    if (e instanceof Error && e.message.includes("SUPABASE_SERVICE_ROLE_KEY")) throw e;
  }
}

if (!url || !anon) {
  // Don't throw at import time so build doesn't fail in CI without env.
  // Throw at first use instead.
}

/**
 * Server-side Supabase client bound to the user's session via cookies.
 * Use in App Router server components and route handlers.
 * Honors RLS — every query runs as the authenticated user.
 */
export async function dbAsUser(): Promise<SupabaseClient> {
  if (!anon) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set. Add it to .env.local and the Vercel project env.");
  }
  const baseUrl = parseSupabaseUrl(url);
  const cookieStore = await cookies();
  return createServerClient(baseUrl.toString(), anon, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet: { name: string; value: string; options: CookieOptions }[]) => {
        for (const { name, value, options } of toSet) {
          cookieStore.set(name, value, options);
        }
      },
    },
  });
}

/**
 * Service-role client — bypasses RLS. Only use in trusted server contexts:
 * Inngest workers, Stripe webhooks, the wedge endpoint (which has no user yet).
 *
 * NEVER expose to the browser. NEVER pass through user-supplied org_id without
 * verifying the caller has membership.
 */
export function dbAsService(): SupabaseClient {
  if (!service) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local and the Vercel project env (service_role JWT, not anon).",
    );
  }
  const baseUrl = parseSupabaseUrl(url);
  assertServiceRoleKey(service);
  return createSupabaseClient(baseUrl.toString(), service, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
