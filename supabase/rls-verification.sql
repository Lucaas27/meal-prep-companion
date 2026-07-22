-- RLS verification queries for v1.3.
-- Run against a Supabase local instance with two test users to verify policies.
-- Replace USER_A_ID and USER_B_ID with actual auth user UUIDs.

/*
-- === Setup test data ===

-- As user A: create an imported ingredient, conversion, recipe, and planner entry
set local role authenticated;
set local "request.jwt.claim.sub" to 'USER_A_ID';

insert into ingredients (
  id, user_id, name, normalized_name,
  calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g,
  source, external_source_id, external_source_name, imported_at
)
values (
  '00000000-0000-0000-0000-000000000001',
  'USER_A_ID',
  'Chicken Breast',
  'chicken breast',
  165, 31, 0, 3.6,
  'usda', '123', 'Chicken Breast, meat only', now()
);

insert into ingredient_unit_conversions (
  id, user_id, ingredient_id, unit, label, grams_per_unit, is_default, source_type, external_source_id
)
values (
  '00000000-0000-0000-0000-000000000010',
  'USER_A_ID',
  '00000000-0000-0000-0000-000000000001',
  'piece', '1 piece', 120, false, 'usda', '123'
);

insert into recipes (id, user_id, name, portions)
values ('00000000-0000-0000-0000-000000000002', 'USER_A_ID', 'Test Recipe', 4);

insert into recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, ingredient_unit_conversion_id, position)
values (
  '00000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  2,
  'piece',
  '00000000-0000-0000-0000-000000000010',
  0
);

insert into dry_to_cooked_calculations (id, user_id, name, dry_weight, cooked_weight, calories_per_100g, protein_per_100g)
values ('00000000-0000-0000-0000-000000000004', 'USER_A_ID', 'Test Rice', 200, 460, 355, 8);

insert into meal_plan_entries (id, user_id, recipe_id, planned_date, meal_slot, servings, position)
values ('00000000-0000-0000-0000-000000000005', 'USER_A_ID', '00000000-0000-0000-0000-000000000002', current_date, 'lunch', 1, 0);

-- === Verification ===

-- User A can see their own data
select count(*) from ingredients where user_id = 'USER_A_ID';  -- expect 1
select count(*) from ingredient_unit_conversions where user_id = 'USER_A_ID'; -- expect 1
select count(*) from recipes where user_id = 'USER_A_ID';       -- expect 1
select count(*) from recipe_ingredients
  where recipe_id in (select id from recipes where user_id = 'USER_A_ID');
  -- expect 1
select count(*) from meal_plan_entries where user_id = 'USER_A_ID'; -- expect 1

-- As user B: should see nothing
set local "request.jwt.claim.sub" to 'USER_B_ID';

select count(*) from ingredients;    -- expect 0
select count(*) from ingredient_unit_conversions; -- expect 0
select count(*) from recipes;        -- expect 0
select count(*) from recipe_ingredients; -- expect 0
select count(*) from meal_plan_entries; -- expect 0

-- User B cannot insert a recipe_ingredient into user A's recipe
-- (should fail with permission denied)
insert into recipe_ingredients (id, recipe_id, ingredient_id, quantity, unit, ingredient_unit_conversion_id, position)
values (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  1,
  'piece',
  '00000000-0000-0000-0000-000000000010',
  1
);

-- User B cannot read or use user A's conversion directly
select count(*) from ingredient_unit_conversions where id = '00000000-0000-0000-0000-000000000010'; -- expect 0
insert into ingredient_unit_conversions (id, user_id, ingredient_id, unit, label, grams_per_unit)
values (
  gen_random_uuid(),
  'USER_B_ID',
  '00000000-0000-0000-0000-000000000001',
  'piece', 'Stolen piece', 120
);

-- User B cannot create a recipe for user A
insert into recipes (id, user_id, name, portions)
values (gen_random_uuid(), 'USER_A_ID', 'Stolen Recipe', 2);

-- Cleanup
delete from meal_plan_entries where id = '00000000-0000-0000-0000-000000000005';
delete from recipe_ingredients where id = '00000000-0000-0000-0000-000000000003';
delete from recipes where id = '00000000-0000-0000-0000-000000000002';
delete from ingredient_unit_conversions where id = '00000000-0000-0000-0000-000000000010';
delete from ingredients where id = '00000000-0000-0000-0000-000000000001';
delete from dry_to_cooked_calculations where id = '00000000-0000-0000-0000-000000000004';
*/
