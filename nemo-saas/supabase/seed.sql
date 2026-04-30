-- Seed for local dev. Creates one demo org, site, and a sample lead.

insert into orgs (id, name, slug, plan)
values ('00000000-0000-0000-0000-000000000001', 'Acme Landscaping', 'acme-landscaping', 'local_autopilot');

insert into sites (
  id, org_id, name, website_url, business_name, city, region, postal_code, primary_category, service_area_zips
) values (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000001',
  'Acme Landscaping — main',
  'https://acmelandscaping.example',
  'Acme Landscaping',
  'Boulder', 'CO', '80301',
  'landscaper',
  array['80301', '80302', '80303', '80304']
);

insert into leads (email, business_name, zip, website_url)
values ('demo@example.com', 'Acme Landscaping', '80301', 'https://acmelandscaping.example');
