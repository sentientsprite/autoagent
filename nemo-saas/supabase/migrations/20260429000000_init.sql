-- Nemo SaaS — initial multi-tenant schema
--
-- Implements v2 plan: org -> sites -> connectors -> scheduled jobs -> artifacts
-- Postgres RLS isolates tenants by org_id. All app queries run as authed users
-- via the anon/authenticated roles; service role is only used by Inngest workers.

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- =============================================================================
-- enums
-- =============================================================================

create type org_role as enum ('owner', 'admin', 'member');
create type plan_tier as enum ('free', 'local_autopilot', 'growth_operator', 'agency');
create type connector_kind as enum (
  'google_search_console',
  'google_analytics_4',
  'google_business_profile',
  'google_ads',
  'meta_ads'
);
create type connector_status as enum ('connected', 'expired', 'revoked', 'error');
create type job_kind as enum (
  'local_visibility_audit',
  'gsc_opportunity_finder',
  'ga4_health_brief',
  'local_landing_builder',
  'paid_qa',
  'reputation_loop',
  'competitor_pulse'
);
create type job_status as enum ('queued', 'running', 'succeeded', 'failed', 'cancelled');
create type artifact_kind as enum ('json', 'pdf', 'html', 'markdown', 'csv');
create type lead_source as enum ('lvs_wedge', 'extension', 'manual', 'partner');

-- =============================================================================
-- tenancy: orgs + memberships
-- =============================================================================

create table orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  plan plan_tier not null default 'free',
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table org_members (
  org_id uuid not null references orgs(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role org_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (org_id, user_id)
);

create index org_members_user_idx on org_members(user_id);

-- =============================================================================
-- sites: a customer "property" (a website or a physical location)
-- =============================================================================

create table sites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  name text not null,
  website_url text,
  -- Local SEO fields
  business_name text,
  street_address text,
  city text,
  region text,
  postal_code text,
  country text default 'US',
  phone text,
  -- Categorization
  primary_category text,             -- e.g. "landscaper", "plumber"
  service_area_zips text[],
  -- Per-site playbook (nemo-workspace pattern, stored inline as markdown)
  playbook_md text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sites_org_idx on sites(org_id);

-- =============================================================================
-- connectors: encrypted OAuth tokens per (site, provider)
-- Token bytes are envelope-encrypted in the app layer using NEMO_TENANT_KMS_KEY
-- before being stored here. We never store plaintext tokens.
-- =============================================================================

create table connectors (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  site_id uuid references sites(id) on delete cascade,
  kind connector_kind not null,
  status connector_status not null default 'connected',
  account_email text,
  -- provider-specific addressing (GSC siteUrl, GA4 propertyId, GBP locationName, etc.)
  remote_id text not null,
  remote_label text,
  -- envelope-encrypted refresh token (base64). Access tokens are not persisted.
  encrypted_refresh_token text not null,
  scopes text[] not null default '{}',
  last_synced_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (site_id, kind, remote_id)
);

create index connectors_org_idx on connectors(org_id);
create index connectors_site_idx on connectors(site_id);

-- =============================================================================
-- jobs: one row per skill execution. The "queue" is just status='queued'.
-- Inngest is the execution engine; this table is the audit log + artifact pointer.
-- =============================================================================

create table jobs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  site_id uuid references sites(id) on delete cascade,
  kind job_kind not null,
  status job_status not null default 'queued',
  -- The Inngest run that owns execution (set when the worker picks it up).
  inngest_run_id text,
  -- Frozen input snapshot so reruns are reproducible.
  input jsonb not null default '{}'::jsonb,
  -- Final structured output from the deterministic step.
  result jsonb,
  -- Error info on failure.
  error_code text,
  error_message text,
  -- Cost / quality observability.
  llm_tokens_in int,
  llm_tokens_out int,
  llm_cost_usd numeric(10, 4),
  duration_ms int,
  -- Scheduling
  scheduled_for timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index jobs_org_idx on jobs(org_id);
create index jobs_site_idx on jobs(site_id);
create index jobs_status_idx on jobs(status) where status in ('queued', 'running');
create index jobs_kind_status_idx on jobs(kind, status);

-- =============================================================================
-- artifacts: blobs (PDFs, HTML reports, JSON dumps) tied to a job.
-- The bytes live in Supabase Storage; this table is the metadata.
-- =============================================================================

create table artifacts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  org_id uuid not null references orgs(id) on delete cascade,
  kind artifact_kind not null,
  storage_path text not null,         -- bucket-relative path inside 'artifacts'
  filename text not null,
  byte_size int,
  mime_type text,
  created_at timestamptz not null default now()
);

create index artifacts_job_idx on artifacts(job_id);
create index artifacts_org_idx on artifacts(org_id);

-- =============================================================================
-- schedules: which jobs are recurring for which sites (plan-gated server-side)
-- =============================================================================

create table schedules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  site_id uuid not null references sites(id) on delete cascade,
  kind job_kind not null,
  cron text not null,                  -- e.g. '0 13 * * 1' (Mondays 13:00 UTC)
  enabled boolean not null default true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_at timestamptz not null default now(),
  unique (site_id, kind)
);

create index schedules_next_run_idx on schedules(next_run_at) where enabled;

-- =============================================================================
-- leads: captured by the wedge (no auth required). Promoted to org on signup.
-- =============================================================================

create table leads (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  business_name text,
  zip text,
  website_url text,
  source lead_source not null default 'lvs_wedge',
  -- The audit job that ran for this lead, if any (anonymous job).
  audit_job_id uuid references jobs(id) on delete set null,
  -- Once they sign up, link to org.
  promoted_org_id uuid references orgs(id) on delete set null,
  created_at timestamptz not null default now()
);

create index leads_email_idx on leads(email);
create index leads_created_idx on leads(created_at desc);

-- =============================================================================
-- updated_at triggers
-- =============================================================================

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end
$$ language plpgsql;

create trigger orgs_set_updated before update on orgs for each row execute function set_updated_at();
create trigger sites_set_updated before update on sites for each row execute function set_updated_at();
create trigger connectors_set_updated before update on connectors for each row execute function set_updated_at();

-- =============================================================================
-- Row Level Security
-- =============================================================================

alter table orgs enable row level security;
alter table org_members enable row level security;
alter table sites enable row level security;
alter table connectors enable row level security;
alter table jobs enable row level security;
alter table artifacts enable row level security;
alter table schedules enable row level security;
alter table leads enable row level security;

-- Helper: is the current user a member of this org?
create or replace function is_org_member(target_org uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from org_members
    where org_id = target_org and user_id = auth.uid()
  );
$$;

create policy orgs_select on orgs for select using (is_org_member(id));
create policy orgs_update on orgs for update using (
  exists (
    select 1 from org_members
    where org_id = orgs.id and user_id = auth.uid() and role in ('owner', 'admin')
  )
);

create policy org_members_select on org_members for select using (
  user_id = auth.uid() or is_org_member(org_id)
);

create policy sites_all on sites for all using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy connectors_all on connectors for all using (is_org_member(org_id)) with check (is_org_member(org_id));
create policy jobs_select on jobs for select using (is_org_member(org_id));
create policy artifacts_select on artifacts for select using (is_org_member(org_id));
create policy schedules_all on schedules for all using (is_org_member(org_id)) with check (is_org_member(org_id));

-- Leads: only service role writes; org sees its own promoted leads.
create policy leads_select on leads for select using (
  promoted_org_id is not null and is_org_member(promoted_org_id)
);
