/**
 * Post-wedge follow-up: notify the team, sync to outbound CRM, schedule nurture.
 * All steps are best-effort — never fail the public wedge response.
 */
import { Resend } from "resend";
import { render } from "@react-email/render";
import React from "react";

import { inngest } from "@/lib/inngest/client";
import { LvsInternalEmail } from "@/lib/email/lvs-internal";

export interface WedgeLeadFollowUpInput {
  leadId: string;
  email: string;
  businessName: string;
  zip: string;
  websiteUrl?: string | null;
  grade: string;
  score: number;
  reportUrl: string;
  topFixTitle?: string | null;
  topFixAction?: string | null;
}

export interface LeadFollowUpResult {
  internalNotified: boolean;
  crmSynced: boolean;
  crmLeadId?: string;
  nurtureScheduled: boolean;
}

function cleanEnv(v: string | undefined): string {
  return (v ?? "").replace(/\r/g, "").trim();
}

function outboundWebhookUrl(): string {
  return cleanEnv(process.env.OUTBOUND_CRM_WEBHOOK_URL).replace(/\/+$/, "");
}

function hunterSecret(): string {
  return cleanEnv(process.env.HUNTER_WEBHOOK_SECRET);
}

function internalNotifyEmails(): string[] {
  return cleanEnv(process.env.LVS_INTERNAL_NOTIFY_EMAIL)
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function crmBaseUrl(): string {
  return cleanEnv(process.env.NEXT_PUBLIC_PRANA_OUTBOUND_CRM_URL).replace(/\/+$/, "");
}

function buildCrmNotes(input: WedgeLeadFollowUpInput): string {
  const lines = [
    "LVS wedge lead — email-first (no phone on form).",
    `LVS: ${input.grade}/${input.score}`,
    `Grade: ${input.grade} (${input.score}/100)`,
    `ZIP: ${input.zip}`,
    input.websiteUrl ? `Website: ${input.websiteUrl}` : null,
    `Report: ${input.reportUrl}`,
    input.topFixTitle ? `Top fix: ${input.topFixTitle}` : null,
    input.topFixAction ? `Action: ${input.topFixAction}` : null,
    `Nemo lead id: ${input.leadId}`,
  ].filter(Boolean);
  return lines.join("\n");
}

async function syncToOutboundCrm(input: WedgeLeadFollowUpInput): Promise<{ ok: boolean; id?: string }> {
  const url = outboundWebhookUrl();
  const secret = hunterSecret();
  if (!url || !secret) return { ok: false };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({
      external_id: `lvs:${input.leadId}`,
      name: input.businessName,
      company: input.businessName,
      email: input.email,
      source: "lvs_wedge",
      notes: buildCrmNotes(input),
      profile: {
        lvs: {
          grade: input.grade,
          score: input.score,
          reportUrl: input.reportUrl,
          checked_at: new Date().toISOString(),
          zip: input.zip,
          topFixTitle: input.topFixTitle ?? null,
          headline: null,
        },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error("lvs crm sync failed", res.status, body.slice(0, 500));
    return { ok: false };
  }

  const json = (await res.json()) as { id?: string };
  return { ok: true, id: json.id };
}

async function notifyInternalTeam(
  input: WedgeLeadFollowUpInput,
  crmLeadId?: string,
): Promise<boolean> {
  const apiKey = cleanEnv(process.env.RESEND_API_KEY);
  const recipients = internalNotifyEmails();
  if (!apiKey || recipients.length === 0) return false;

  const crmBase = crmBaseUrl();
  const crmLeadUrl = crmBase && crmLeadId ? `${crmBase}/leads/${crmLeadId}` : null;

  const html = await render(
    React.createElement(LvsInternalEmail, {
      businessName: input.businessName,
      email: input.email,
      zip: input.zip,
      websiteUrl: input.websiteUrl,
      grade: input.grade,
      score: input.score,
      reportUrl: input.reportUrl,
      topFixTitle: input.topFixTitle,
      topFixAction: input.topFixAction,
      leadId: input.leadId,
      crmLeadUrl,
    }),
  );

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "Nemo Local <reports@nemo.local>",
    to: recipients,
    subject: `New LVS lead: ${input.businessName} (${input.grade})`,
    html,
  });
  return true;
}

async function scheduleNurtureFollowUp(input: WedgeLeadFollowUpInput): Promise<boolean> {
  if (!cleanEnv(process.env.INNGEST_EVENT_KEY)) return false;

  await inngest.send({
    name: "nemo/lead.wedge.followup",
    data: {
      leadId: input.leadId,
      email: input.email,
      businessName: input.businessName,
      grade: input.grade,
      reportUrl: input.reportUrl,
      topFixAction: input.topFixAction ?? null,
    },
  });
  return true;
}

/** Run all follow-up steps. Errors are logged, not thrown. */
export async function runLeadFollowUp(input: WedgeLeadFollowUpInput): Promise<LeadFollowUpResult> {
  const result: LeadFollowUpResult = {
    internalNotified: false,
    crmSynced: false,
    nurtureScheduled: false,
  };

  try {
    const crm = await syncToOutboundCrm(input);
    result.crmSynced = crm.ok;
    if (crm.id) result.crmLeadId = crm.id;
  } catch (err) {
    console.error("lvs crm sync error", err);
  }

  try {
    result.internalNotified = await notifyInternalTeam(input, result.crmLeadId);
  } catch (err) {
    console.error("lvs internal notify error", err);
  }

  try {
    result.nurtureScheduled = await scheduleNurtureFollowUp(input);
  } catch (err) {
    console.error("lvs nurture schedule error", err);
  }

  return result;
}
