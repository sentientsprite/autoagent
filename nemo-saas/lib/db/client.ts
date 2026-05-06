import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
  if (!url || !anon) throw new Error("Supabase env vars missing");
  const cookieStore = await cookies();
  return createServerClient(url, anon, {
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
  if (!url || !service) throw new Error("Supabase service env vars missing");
  assertServiceRoleKey(service);
  return createSupabaseClient(url, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
