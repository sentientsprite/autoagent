// Domain types mirroring supabase/migrations/20260429000000_init.sql.
// Keep in sync by hand for now; switch to `supabase gen types` once the schema stabilizes.

export type OrgRole = "owner" | "admin" | "member";
export type PlanTier = "free" | "local_autopilot" | "growth_operator" | "agency";

export type ConnectorKind =
  | "google_search_console"
  | "google_analytics_4"
  | "google_business_profile"
  | "google_ads"
  | "meta_ads";

export type ConnectorStatus = "connected" | "expired" | "revoked" | "error";

export type JobKind =
  | "local_visibility_audit"
  | "gsc_opportunity_finder"
  | "ga4_health_brief"
  | "local_landing_builder"
  | "paid_qa"
  | "reputation_loop"
  | "competitor_pulse";

export type JobStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";
export type ArtifactKind = "json" | "pdf" | "html" | "markdown" | "csv";

export interface Org {
  id: string;
  name: string;
  slug: string;
  plan: PlanTier;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Site {
  id: string;
  org_id: string;
  name: string;
  website_url: string | null;
  business_name: string | null;
  street_address: string | null;
  city: string | null;
  region: string | null;
  postal_code: string | null;
  country: string | null;
  phone: string | null;
  primary_category: string | null;
  service_area_zips: string[] | null;
  playbook_md: string | null;
  created_at: string;
  updated_at: string;
}

export interface Connector {
  id: string;
  org_id: string;
  site_id: string | null;
  kind: ConnectorKind;
  status: ConnectorStatus;
  account_email: string | null;
  remote_id: string;
  remote_label: string | null;
  encrypted_refresh_token: string;
  scopes: string[];
  last_synced_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Job<TInput = unknown, TResult = unknown> {
  id: string;
  org_id: string;
  site_id: string | null;
  kind: JobKind;
  status: JobStatus;
  inngest_run_id: string | null;
  input: TInput;
  result: TResult | null;
  error_code: string | null;
  error_message: string | null;
  llm_tokens_in: number | null;
  llm_tokens_out: number | null;
  llm_cost_usd: string | null;
  duration_ms: number | null;
  scheduled_for: string | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface Artifact {
  id: string;
  job_id: string;
  org_id: string;
  kind: ArtifactKind;
  storage_path: string;
  filename: string;
  byte_size: number | null;
  mime_type: string | null;
  created_at: string;
}

export interface Schedule {
  id: string;
  org_id: string;
  site_id: string;
  kind: JobKind;
  cron: string;
  enabled: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
}

export interface Lead {
  id: string;
  email: string;
  business_name: string | null;
  zip: string | null;
  website_url: string | null;
  source: "lvs_wedge" | "extension" | "manual" | "partner";
  audit_job_id: string | null;
  promoted_org_id: string | null;
  created_at: string;
}
