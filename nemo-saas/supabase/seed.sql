-- Seed for local dev. Creates one demo org, two sites (locations), and a sample lead.

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


-- Second location for Money Farm P0 (≥2 locations / franchise HQ path)
insert into sites (
  id, org_id, name, website_url, business_name, city, region, postal_code, primary_category, service_area_zips
) values (
  '00000000-0000-0000-0000-000000000011',
  '00000000-0000-0000-0000-000000000001',
  'Acme Landscaping — Denver',
  'https://acmelandscaping.example/denver',
  'Acme Landscaping',
  'Denver', 'CO', '80202',
  'landscaper',
  array['80202', '80203', '80205', '80206']
);

insert into leads (email, business_name, zip, website_url)
values ('demo@example.com', 'Acme Landscaping', '80301', 'https://acmelandscaping.example');
