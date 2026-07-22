create or replace function public.import_external_ingredient_atomic(p_payload jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_name text;
  v_normalized_name text;
  v_category text;
  v_source text;
  v_external_source_id text;
  v_external_source_name text;
  v_calories real;
  v_protein real;
  v_carbs real;
  v_fat real;
  v_now timestamptz := now();
  v_existing ingredients%rowtype;
  v_created ingredients%rowtype;
  v_created_conversion ingredient_unit_conversions%rowtype;
  v_conversion jsonb;
  v_conversions jsonb := '[]'::jsonb;
  v_conversion_count integer := 0;
  v_default_count integer := 0;
begin
  if v_user_id is null then
    raise exception using errcode = '42501', message = 'Not authenticated';
  end if;

  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then
    return jsonb_build_object('status', 'validation_error', 'message', 'Invalid import payload.');
  end if;

  v_name := btrim(coalesce(p_payload->>'name', ''));
  v_category := btrim(coalesce(p_payload->>'category', ''));
  v_source := btrim(coalesce(p_payload->>'provider', ''));
  v_external_source_id := btrim(coalesce(p_payload->>'externalId', ''));
  v_external_source_name := btrim(coalesce(p_payload->>'externalSourceName', ''));
  v_normalized_name := regexp_replace(lower(v_name), '\s+', ' ', 'g');

  if v_name = '' then
    return jsonb_build_object('status', 'validation_error', 'message', 'Ingredient name is required.');
  end if;

  if v_source not in ('usda', 'open-food-facts') then
    return jsonb_build_object('status', 'validation_error', 'message', 'Unsupported provider.');
  end if;

  if v_external_source_id = '' then
    return jsonb_build_object('status', 'validation_error', 'message', 'External source ID is required.');
  end if;

  if v_external_source_name = '' then
    return jsonb_build_object('status', 'validation_error', 'message', 'External source name is required.');
  end if;

  begin
    v_calories := (p_payload->>'caloriesPer100g')::real;
    v_protein := (p_payload->>'proteinPer100g')::real;
    v_carbs := coalesce((p_payload->>'carbsPer100g')::real, 0);
    v_fat := coalesce((p_payload->>'fatPer100g')::real, 0);
  exception
    when others then
      return jsonb_build_object('status', 'validation_error', 'message', 'Nutrition values must be numbers.');
  end;

  if v_calories is null or v_calories < 0 or v_protein is null or v_protein < 0 or v_carbs < 0 or v_fat < 0 then
    return jsonb_build_object('status', 'validation_error', 'message', 'Nutrition values must be zero or greater per 100g.');
  end if;

  if p_payload ? 'approvedConversions' and jsonb_typeof(p_payload->'approvedConversions') <> 'array' then
    return jsonb_build_object('status', 'validation_error', 'message', 'Approved conversions must be an array.');
  end if;

  select *
  into v_existing
  from ingredients
  where user_id = v_user_id
    and source = v_source
    and external_source_id = v_external_source_id
  limit 1;

  if found then
    return jsonb_build_object(
      'status',
      'duplicate',
      'ingredient',
      to_jsonb(v_existing),
      'conversions',
      coalesce(
        (
          select jsonb_agg(to_jsonb(c) order by c.is_default desc, c.label)
          from ingredient_unit_conversions c
          where c.ingredient_id = v_existing.id
        ),
        '[]'::jsonb
      )
    );
  end if;

  if p_payload ? 'approvedConversions' then
    select count(*)
    into v_conversion_count
    from jsonb_array_elements(p_payload->'approvedConversions');

    select count(*)
    into v_default_count
    from jsonb_array_elements(p_payload->'approvedConversions') value
    where coalesce((value->>'isDefault')::boolean, false);

    if v_default_count > 1 then
      return jsonb_build_object('status', 'validation_error', 'message', 'Only one default conversion is allowed.');
    end if;

    if exists (
      select 1
      from (
        select lower(btrim(value->>'label')) as label
        from jsonb_array_elements(p_payload->'approvedConversions') value
      ) labels
      where label = ''
    ) then
      return jsonb_build_object('status', 'validation_error', 'message', 'Conversion labels are required.');
    end if;

    if (
      select count(*)
      from (
        select distinct lower(btrim(value->>'label')) as label
        from jsonb_array_elements(p_payload->'approvedConversions') value
      ) labels
    ) <> v_conversion_count then
      return jsonb_build_object('status', 'validation_error', 'message', 'Conversion labels must be unique per ingredient.');
    end if;
  end if;

  insert into ingredients (
    user_id,
    name,
    normalized_name,
    calories_per_100g,
    protein_per_100g,
    carbs_per_100g,
    fat_per_100g,
    category,
    source,
    external_source_id,
    external_source_name,
    imported_at
  )
  values (
    v_user_id,
    v_name,
    v_normalized_name,
    v_calories,
    v_protein,
    v_carbs,
    v_fat,
    nullif(v_category, ''),
    v_source,
    v_external_source_id,
    v_external_source_name,
    v_now
  )
  returning * into v_created;

  for v_conversion in
    select value
    from jsonb_array_elements(coalesce(p_payload->'approvedConversions', '[]'::jsonb))
  loop
    if jsonb_typeof(v_conversion) <> 'object' then
      return jsonb_build_object('status', 'validation_error', 'message', 'Each conversion must be an object.');
    end if;

    if btrim(coalesce(v_conversion->>'unit', '')) not in ('ml', 'l', 'tsp', 'tbsp', 'cup', 'item', 'piece', 'slice', 'clove', 'can', 'pack') then
      return jsonb_build_object('status', 'validation_error', 'message', 'Conversion unit is invalid.');
    end if;

    if btrim(coalesce(v_conversion->>'label', '')) = '' then
      return jsonb_build_object('status', 'validation_error', 'message', 'Conversion label is required.');
    end if;

    begin
      if coalesce((v_conversion->>'gramsPerUnit')::real, 0) <= 0 then
        return jsonb_build_object('status', 'validation_error', 'message', 'Conversion grams per unit must be greater than zero.');
      end if;
    exception
      when others then
        return jsonb_build_object('status', 'validation_error', 'message', 'Conversion grams per unit must be a number.');
    end;

    if coalesce(nullif(btrim(coalesce(v_conversion->>'sourceType', '')), ''), v_source) not in ('manual', 'usda', 'open-food-facts') then
      return jsonb_build_object('status', 'validation_error', 'message', 'Conversion source type is invalid.');
    end if;

    insert into ingredient_unit_conversions (
      user_id,
      ingredient_id,
      unit,
      label,
      grams_per_unit,
      is_default,
      source_type,
      external_source_id
    )
    values (
      v_user_id,
      v_created.id,
      btrim(v_conversion->>'unit'),
      btrim(v_conversion->>'label'),
      (v_conversion->>'gramsPerUnit')::real,
      coalesce((v_conversion->>'isDefault')::boolean, false),
      coalesce(nullif(btrim(coalesce(v_conversion->>'sourceType', '')), ''), v_source),
      coalesce(nullif(btrim(coalesce(v_conversion->>'externalSourceId', '')), ''), v_external_source_id)
    )
    returning * into v_created_conversion;

    v_conversions := v_conversions || jsonb_build_array(to_jsonb(v_created_conversion));
  end loop;

  return jsonb_build_object(
    'status',
    'created',
    'ingredient',
    to_jsonb(v_created),
    'conversions',
    v_conversions
  );
exception
  when unique_violation then
    select *
    into v_existing
    from ingredients
    where user_id = v_user_id
      and source = v_source
      and external_source_id = v_external_source_id
    limit 1;

    if found then
      return jsonb_build_object(
        'status',
        'duplicate',
        'ingredient',
        to_jsonb(v_existing),
        'conversions',
        coalesce(
          (
            select jsonb_agg(to_jsonb(c) order by c.is_default desc, c.label)
            from ingredient_unit_conversions c
            where c.ingredient_id = v_existing.id
          ),
          '[]'::jsonb
        )
      );
    end if;

    return jsonb_build_object('status', 'storage_error', 'message', 'Failed to save imported ingredient.');
  when others then
    return jsonb_build_object('status', 'storage_error', 'message', sqlerrm);
end;
$$;

revoke all on function public.import_external_ingredient_atomic(jsonb) from public;
grant execute on function public.import_external_ingredient_atomic(jsonb) to authenticated;
