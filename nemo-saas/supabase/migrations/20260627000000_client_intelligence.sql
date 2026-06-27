-- Client intelligence layer: per-site CLIENT.md + weekly plain-English briefs.
--
-- This is the productized version of the "VELLUM.md" pattern for local SMB
-- marketing: every agent reads the client file before touching the account,
-- and every meaningful action appends an intelligence event.

alter type job_kind add value if not exists 'weekly_client_brief';
alter type job_kind add value if not exists 'client_intelligence_update';

-- Current canonical markdown file for a site. One row per site.
create table client_intelligence_files (
  site_id uuid primary key references sites(id) on delete cascade,
  org_id uuid not null references orgs(id) on delete cascade,
  client_md text not null default '',
  summary jsonb not null default '{}'::jsonb,
  version int not null default 1,
  last_event_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint client_intelligence_files_site_org_unique unique (site_id, org_id)
);

create index client_intelligence_files_org_idx on client_intelligence_files(org_id);

-- Append-only memory log. Agents write here after actions; the canonical
-- CLIENT.md is regenerated or patched from these events.
create table client_intelligence_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  site_id uuid not null references sites(id) on delete cascade,
  job_id uuid references jobs(id) on delete set null,
  actor text not null,                         -- e.g. auditor, content, reporter, human
  section text not null,                       -- who_they_are, works, hypotheses, changes, questions
  event_md text not null,
  evidence jsonb not null default '{}'::jsonb, -- structured source data, URLs, metrics, run ids
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index client_intelligence_events_site_created_idx
  on client_intelligence_events(site_id, created_at desc);
create index client_intelligence_events_org_idx on client_intelligence_events(org_id);

-- Monday two-paragraph client-facing brief. Not a dashboard report; a short
-- narrative: what worked, what changed, what we do next.
create table weekly_client_briefs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  site_id uuid not null references sites(id) on delete cascade,
  week_start date not null,
  brief_md text not null,
  source_job_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (site_id, week_start)
);

create index weekly_client_briefs_org_week_idx on weekly_client_briefs(org_id, week_start desc);
create index weekly_client_briefs_site_week_idx on weekly_client_briefs(site_id, week_start desc);

alter table client_intelligence_files enable row level security;
alter table client_intelligence_events enable row level security;
alter table weekly_client_briefs enable row level security;

create policy client_intelligence_files_select
  on client_intelligence_files for select
  using (is_org_member(org_id));

create policy client_intelligence_files_write
  on client_intelligence_files for all
  using (is_org_member(org_id))
  with check (is_org_member(org_id));

create policy client_intelligence_events_select
  on client_intelligence_events for select
  using (is_org_member(org_id));

create policy client_intelligence_events_insert
  on client_intelligence_events for insert
  with check (is_org_member(org_id));

create policy weekly_client_briefs_select
  on weekly_client_briefs for select
  using (is_org_member(org_id));

create policy weekly_client_briefs_write
  on weekly_client_briefs for all
  using (is_org_member(org_id))
  with check (is_org_member(org_id));

create trigger client_intelligence_files_set_updated
  before update on client_intelligence_files
  for each row execute function set_updated_at();

comment on table client_intelligence_files is
  'Canonical per-site CLIENT.md. Loaded before every agent/skill run.';
comment on table client_intelligence_events is
  'Append-only updates that explain what agents learned or changed for a client.';
comment on table weekly_client_briefs is
  'Two-paragraph Monday client briefs generated from CLIENT.md + recent jobs.';
