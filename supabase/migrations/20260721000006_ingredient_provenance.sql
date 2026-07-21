-- Add external provenance fields to ingredients.
-- Existing ingredients remain unchanged (source stays as-is).

-- 1. Expand source check constraint to include new provider types
alter table ingredients
  drop constraint if exists ingredients_source_check;

alter table ingredients
  add constraint ingredients_source_check
    check (source in ('starter', 'custom', 'usda', 'open-food-facts'));

-- 2. Add provenance columns
alter table ingredients
  add column external_source_id text,
  add column external_source_name text,
  add column imported_at timestamptz;

-- 3. Partial unique constraint: one user cannot import same provider+external_id twice
create unique index idx_ingredients_user_provider_external
  on ingredients(user_id, source, external_source_id)
  where source in ('usda', 'open-food-facts') and external_source_id is not null;
