create or replace function public.get_barcode_product_cache(p_normalized_barcode text)
returns jsonb
language sql
security definer
set search_path = ''
stable
as $$
  select to_jsonb(bp)
  from private.barcode_products bp
  where bp.normalized_barcode = p_normalized_barcode
  limit 1;
$$;

create or replace function public.upsert_barcode_product_cache(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row private.barcode_products%rowtype;
begin
  insert into private.barcode_products (
    normalized_barcode,
    provider,
    provider_product_id,
    product_name,
    brand,
    image_url,
    package_quantity_text,
    serving_size_text,
    serving_quantity_grams,
    calories_per_100g,
    protein_per_100g,
    carbohydrates_per_100g,
    fat_per_100g,
    fibre_per_100g,
    salt_per_100g,
    sodium_per_100g,
    raw_provider_response,
    completeness_status,
    fetched_at,
    expires_at
  )
  values (
    p_payload->>'normalized_barcode',
    p_payload->>'provider',
    p_payload->>'provider_product_id',
    nullif(p_payload->>'product_name', ''),
    nullif(p_payload->>'brand', ''),
    nullif(p_payload->>'image_url', ''),
    nullif(p_payload->>'package_quantity_text', ''),
    nullif(p_payload->>'serving_size_text', ''),
    (p_payload->>'serving_quantity_grams')::real,
    (p_payload->>'calories_per_100g')::real,
    (p_payload->>'protein_per_100g')::real,
    (p_payload->>'carbohydrates_per_100g')::real,
    (p_payload->>'fat_per_100g')::real,
    (p_payload->>'fibre_per_100g')::real,
    (p_payload->>'salt_per_100g')::real,
    (p_payload->>'sodium_per_100g')::real,
    coalesce(p_payload->'raw_provider_response', '{}'::jsonb),
    p_payload->>'completeness_status',
    coalesce((p_payload->>'fetched_at')::timestamptz, now()),
    (p_payload->>'expires_at')::timestamptz
  )
  on conflict (normalized_barcode)
  do update set
    provider = excluded.provider,
    provider_product_id = excluded.provider_product_id,
    product_name = excluded.product_name,
    brand = excluded.brand,
    image_url = excluded.image_url,
    package_quantity_text = excluded.package_quantity_text,
    serving_size_text = excluded.serving_size_text,
    serving_quantity_grams = excluded.serving_quantity_grams,
    calories_per_100g = excluded.calories_per_100g,
    protein_per_100g = excluded.protein_per_100g,
    carbohydrates_per_100g = excluded.carbohydrates_per_100g,
    fat_per_100g = excluded.fat_per_100g,
    fibre_per_100g = excluded.fibre_per_100g,
    salt_per_100g = excluded.salt_per_100g,
    sodium_per_100g = excluded.sodium_per_100g,
    raw_provider_response = excluded.raw_provider_response,
    completeness_status = excluded.completeness_status,
    fetched_at = excluded.fetched_at,
    expires_at = excluded.expires_at
  returning * into v_row;

  return to_jsonb(v_row);
end;
$$;

revoke all on function public.get_barcode_product_cache(text) from public;
revoke all on function public.upsert_barcode_product_cache(jsonb) from public;
grant execute on function public.get_barcode_product_cache(text) to service_role;
grant execute on function public.upsert_barcode_product_cache(jsonb) to service_role;
