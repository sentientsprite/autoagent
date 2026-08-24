import { NextResponse } from "next/server";

import { dbAsService } from "@/lib/db/client";

export const runtime = "nodejs";

/**
 * One-click approve for a content_draft row (no auto-publish).
 * POST { id } — sets status=approved.
 * Auth: Bearer CRON_SECRET or service cookie later; for now CRON_SECRET / CONTENT_DRAFT_SECRET.
 */
export async function POST(request: Request) {
  const secret =
    process.env.CONTENT_DRAFT_SECRET?.trim() || process.env.CRON_SECRET?.trim() || "";
  if (!secret) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }
  const auth = request.headers.get("authorization") || "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { id?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const id = typeof body.id === "string" ? body.id.trim() : "";
  if (!id) return NextResponse.json({ error: "id_required" }, { status: 400 });

  const db = dbAsService();
  const { data, error } = await db
    .from("content_drafts")
    .update({ status: "approved", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "draft")
    .select("id, title, status")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "not_found_or_not_draft", detail: error?.message }, { status: 404 });
  }

  return NextResponse.json({ ok: true, draft: data });
}

export async function GET(request: Request) {
  const secret =
    process.env.CONTENT_DRAFT_SECRET?.trim() || process.env.CRON_SECRET?.trim() || "";
  if (!secret) {
    return NextResponse.json({ error: "server_misconfigured" }, { status: 500 });
  }
  const auth = request.headers.get("authorization") || "";
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const status = new URL(request.url).searchParams.get("status") || "draft";
  const db = dbAsService();
  const { data, error } = await db
    .from("content_drafts")
    .select("id, title, channel, week_start, status, created_at")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ drafts: data ?? [] });
}
