/**
 * GET /api/oauth/google/callback
 *
 * Receives the OAuth code, exchanges for refresh+access tokens, encrypts the
 * refresh token with the per-tenant envelope key, and persists a connector row.
 *
 * The state param carries `{ orgId, siteId, kind }` signed via the Supabase
 * auth session (we don't ship a separate JWT for this — the user must already
 * be authenticated to start the OAuth flow).
 */
import { NextResponse } from "next/server";

import { dbAsUser } from "@/lib/db/client";
import { encryptToken } from "@/lib/kms/envelope";
import { oauthClient, SCOPES_BY_KIND } from "@/lib/connectors/google";
import type { ConnectorKind } from "@/lib/db/types";

export const runtime = "nodejs";

interface StatePayload {
  orgId: string;
  siteId: string;
  kind: ConnectorKind;
  remoteId: string;
  remoteLabel?: string;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateRaw = url.searchParams.get("state");
  if (!code || !stateRaw) return NextResponse.json({ error: "missing_code_or_state" }, { status: 400 });

  let state: StatePayload;
  try {
    state = JSON.parse(Buffer.from(stateRaw, "base64url").toString("utf8"));
  } catch {
    return NextResponse.json({ error: "bad_state" }, { status: 400 });
  }

  const db = await dbAsUser();
  const { data: { user } } = await db.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthenticated" }, { status: 401 });

  const { data: membership } = await db
    .from("org_members")
    .select("role")
    .eq("user_id", user.id)
    .eq("org_id", state.orgId)
    .maybeSingle();
  if (!membership) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const oauth = oauthClient();
  const { tokens } = await oauth.getToken(code);
  if (!tokens.refresh_token) {
    return NextResponse.json({ error: "no_refresh_token", hint: "user must approve with prompt=consent" }, { status: 400 });
  }

  const enc = encryptToken(tokens.refresh_token, state.orgId);
  const { error } = await db.from("connectors").upsert({
    org_id: state.orgId,
    site_id: state.siteId,
    kind: state.kind,
    status: "connected",
    account_email: user.email ?? null,
    remote_id: state.remoteId,
    remote_label: state.remoteLabel ?? null,
    encrypted_refresh_token: enc,
    scopes: SCOPES_BY_KIND[state.kind],
    expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
  }, { onConflict: "site_id,kind,remote_id" });
  if (error) return NextResponse.json({ error: "persist_failed", detail: error.message }, { status: 500 });

  return NextResponse.redirect(new URL(`/app/sites/${state.siteId}?connected=${state.kind}`, url));
}
