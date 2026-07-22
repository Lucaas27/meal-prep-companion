create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;
grant usage on schema private to service_role;

create table private.barcode_products (
  id uuid primary key default uuid_generate_v4(),
  normalized_barcode text not null,
  provider text not null check (provider in ('open_food_facts')),
  provider_product_id text not null,
  product_name text,
  brand text,
  image_url text,
  package_quantity_text text,
  serving_size_text text,
  serving_quantity_grams real check (serving_quantity_grams is null or serving_quantity_grams > 0),
  calories_per_100g real check (calories_per_100g is null or calories_per_100g >= 0),
  protein_per_100g real check (protein_per_100g is null or protein_per_100g >= 0),
  carbohydrates_per_100g real check (carbohydrates_per_100g is null or carbohydrates_per_100g >= 0),
  fat_per_100g real check (fat_per_100g is null or fat_per_100g >= 0),
  fibre_per_100g real check (fibre_per_100g is null or fibre_per_100g >= 0),
  salt_per_100g real check (salt_per_100g is null or salt_per_100g >= 0),
  sodium_per_100g real check (sodium_per_100g is null or sodium_per_100g >= 0),
  raw_provider_response jsonb not null default '{}'::jsonb,
  completeness_status text not null check (completeness_status in ('complete', 'partial', 'missing_name', 'missing_nutrition')),
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint barcode_products_normalized_barcode_key unique (normalized_barcode)
);

create trigger barcode_products_updated_at
  before update on private.barcode_products
  for each row execute function set_updated_at();

create index idx_barcode_products_provider_product_id
  on private.barcode_products(provider, provider_product_id);

create index idx_barcode_products_expires_at
  on private.barcode_products(expires_at);

alter table private.barcode_products enable row level security;

create policy "Service role can manage barcode products"
  on private.barcode_products
  for all
  to service_role
  using (true)
  with check (true);

revoke all on table private.barcode_products from public;
revoke all on table private.barcode_products from anon;
revoke all on table private.barcode_products from authenticated;
grant select, insert, update, delete on table private.barcode_products to service_role;
