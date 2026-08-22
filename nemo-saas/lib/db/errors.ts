/**
 * Classify Supabase/PostgREST failures by the layer that actually failed,
 * so API responses and operator hints name the real fix (host vs schema
 * vs key) instead of a generic "persist failed".
 *
 * Ground truth (installed @supabase/postgrest-js): a rejected fetch() is
 * wrapped, not thrown — the error becomes
 *   { message: "TypeError: fetch failed", details: "...Caused by: ... (ENOTFOUND)",
 *     hint: "", code: "" }
 * on a response whose HTTP status is 0. That signature means the request
 * never received an HTTP response at all (DNS/TCP/TLS), which rules out
 * schema and credential problems: a missing table comes back as HTTP 404
 * with code PGRST205, a bad key as HTTP 401 "Invalid API key".
 */

export type SupabaseFailureCategory =
  | "unreachable_host"
  | "missing_table"
  | "invalid_key"
  | "unknown";

export interface SupabaseErrorLike {
  message?: string | null;
  details?: string | null;
  hint?: string | null;
  code?: string | null;
  /** HTTP status from the PostgREST response object (0 when fetch rejected). */
  status?: number | null;
}

export interface ClassifiedSupabaseError {
  category: SupabaseFailureCategory;
  /** Network cause code (ENOTFOUND, ECONNREFUSED, ...) when the SDK surfaced one. */
  causeCode: string | null;
  /** Operator-facing hint naming the failing layer. */
  hint: string;
}

const NETWORK_RE =
  /fetch failed|networkerror|econnrefused|enotfound|etimedout|eai_again|econnreset|ehostunreach|und_err|getaddrinfo|socket hang up/i;

const CAUSE_CODE_RE =
  /\b(ENOTFOUND|ECONNREFUSED|ETIMEDOUT|EAI_AGAIN|ECONNRESET|EHOSTUNREACH|UND_ERR_[A-Z_]+|DEPTH_ZERO_SELF_SIGNED_CERT|UNABLE_TO_VERIFY_LEAF_SIGNATURE|CERT_HAS_EXPIRED)\b/;

const MISSING_TABLE_RE =
  /relation\s+\S+\s+does not exist|could not find the table|schema cache/i;

const INVALID_KEY_RE =
  /invalid api key|invalid claim|malformed jwt|jwt expired/i;

export function classifySupabaseError(
  err: SupabaseErrorLike | null | undefined,
): ClassifiedSupabaseError {
  const message = err?.message ?? "";
  const details = err?.details ?? "";
  const code = err?.code ?? "";
  const status = typeof err?.status === "number" ? err.status : null;

  const causeCode =
    details.match(CAUSE_CODE_RE)?.[1]?.toUpperCase() ??
    message.match(CAUSE_CODE_RE)?.[1]?.toUpperCase() ??
    null;

  // Network layer first: status 0 is postgrest-js's marker for "fetch()
  // rejected, no HTTP response exists". Nothing server-side was evaluated,
  // so table/key hints are guaranteed to be wrong for this signature.
  if (status === 0 || NETWORK_RE.test(message) || NETWORK_RE.test(details)) {
    return {
      category: "unreachable_host",
      causeCode,
      hint:
        `The request never reached Supabase — no HTTP response` +
        (causeCode ? ` (cause: ${causeCode})` : "") +
        ". Verify NEXT_PUBLIC_SUPABASE_URL points at an existing, unpaused project: " +
        "DNS-resolve the host and compare the project ref against Supabase → Project Settings → General, " +
        "then fix the Vercel env and redeploy. Migrations and key rotation will NOT fix this layer.",
    };
  }

  if (code === "PGRST205" || code === "42P01" || MISSING_TABLE_RE.test(message)) {
    return {
      category: "missing_table",
      causeCode,
      hint:
        "The hosted project has no schema. Run the hosted Supabase migrations in order " +
        "(QUICKSTART.md § Hosted Supabase), wait ~1m for the PostgREST schema cache, then retry.",
    };
  }

  if (status === 401 || status === 403 || INVALID_KEY_RE.test(message)) {
    return {
      category: "invalid_key",
      causeCode,
      hint:
        "Supabase rejected the credential over HTTP. Set SUPABASE_SERVICE_ROLE_KEY to the " +
        "service_role JWT (not the anon key) from Supabase → Project Settings → API, then redeploy.",
    };
  }

  return {
    category: "unknown",
    causeCode,
    hint: "Unclassified Supabase failure — check the Vercel function logs for the logged details field.",
  };
}
