-- Weekly pSEO / content drafts for sales pipeline (approve before publish)
alter type job_kind add value if not exists 'content_draft_batch';

create table if not exists content_drafts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs(id) on delete cascade,
  site_id uuid references sites(id) on delete set null,
  week_start date not null,
  channel text not null default 'pseo',
  title text not null,
  body_md text not null,
  status text not null default 'draft'
    check (status in ('draft', 'approved', 'published', 'discarded')),
  source_job_id uuid references jobs(id) on delete set null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists content_drafts_org_week_idx
  on content_drafts (org_id, week_start desc);
create index if not exists content_drafts_status_idx
  on content_drafts (status, created_at desc);

alter table content_drafts enable row level security;

drop policy if exists content_drafts_select on content_drafts;
create policy content_drafts_select
  on content_drafts for select
  using (is_org_member(org_id));

drop policy if exists content_drafts_write on content_drafts;
create policy content_drafts_write
  on content_drafts for all
  using (is_org_member(org_id))
  with check (is_org_member(org_id));

comment on table content_drafts is
  'Weekly content/pSEO drafts from Inngest; human approve before publish. No blind auto-post.';
