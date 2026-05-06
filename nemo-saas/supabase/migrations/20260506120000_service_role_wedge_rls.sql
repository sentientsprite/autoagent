-- Idempotent for local replays
drop policy if exists orgs_service_role_all on public.orgs;
drop policy if exists leads_service_role_all on public.leads;
drop policy if exists jobs_service_role_all on public.jobs;
drop policy if exists artifacts_service_role_all on public.artifacts;

-- Ensures INSERT ... RETURNING works for /api/lvs when the service JWT is used.
-- (If the service key were swapped for anon, fix env — see lib/db/client.ts assertion.)

create policy orgs_service_role_all on public.orgs
  for all
  to service_role
  using (true)
  with check (true);

create policy leads_service_role_all on public.leads
  for all
  to service_role
  using (true)
  with check (true);

create policy jobs_service_role_all on public.jobs
  for all
  to service_role
  using (true)
  with check (true);

create policy artifacts_service_role_all on public.artifacts
  for all
  to service_role
  using (true)
  with check (true);
