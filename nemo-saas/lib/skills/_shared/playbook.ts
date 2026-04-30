/**
 * Per-tenant playbook — ported from the nemo-workspace markdown pattern.
 *
 * Generates a single AGENTS.md-style document per Site that becomes the
 * system-level context for narrative LLM calls. Stored on `sites.playbook_md`
 * and re-rendered whenever the site profile changes.
 *
 * Why markdown and not JSON: the LLM consumes it directly and humans can
 * eyeball it during support tickets. JSON would force serialization both ways.
 */

import type { Site } from "@/lib/db/types";

export interface PlaybookOptions {
  /** Override the brand voice — defaults to "direct, plain-English, no jargon". */
  voice?: string;
  /** Reporting cadence reminder for narrative skills. */
  cadence?: "weekly" | "monthly";
}

export function renderPlaybook(site: Site, opts: PlaybookOptions = {}): string {
  const voice = opts.voice ?? "direct, plain-English, no jargon, written for a busy SMB owner";
  const cadence = opts.cadence ?? "monthly";

  const sa = site.service_area_zips?.length
    ? site.service_area_zips.join(", ")
    : "(none configured)";

  return `# Nemo playbook for ${site.business_name ?? site.name}

## Identity
- Business: ${site.business_name ?? site.name}
- Category: ${site.primary_category ?? "(unspecified)"}
- Website: ${site.website_url ?? "(none)"}
- Address: ${site.street_address ?? ""} ${site.city ?? ""}, ${site.region ?? ""} ${site.postal_code ?? ""}
- Phone: ${site.phone ?? "(unset)"}
- Service-area zips: ${sa}

## Voice
${voice}

## Reporting cadence
${cadence}

## Rules of engagement (non-negotiable)
1. Never invent metrics. If a number isn't in the structured input, do not state it.
2. Every recommendation must reference a specific Insight id from the rule engine.
3. Use the owner's first name only if provided; otherwise address as "team".
4. Keep paragraphs short (2–4 sentences). One CTA per section.
5. Prefer dollars-and-jobs framing over rankings ("a missed lead per week" beats "a position drop").

## Memory (rolling)
${''}
> The control plane appends a short "what changed since last report" snippet here
> before each narrative call. This file is the single context source.
`;
}
