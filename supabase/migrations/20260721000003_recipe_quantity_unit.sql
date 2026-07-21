-- Replace quantity_grams with quantity + unit on recipe_ingredients.
-- Down migration is not maintained — rollback requires restoring a backup.

-- 1. Add new columns (nullable initially for the transition)
alter table recipe_ingredients
  add column quantity real,
  add column unit text,
  add column ingredient_unit_conversion_id uuid;

-- 2. Migrate existing data
update recipe_ingredients
  set quantity = quantity_grams,
      unit = 'g'
  where quantity is null;

-- 3. Add constraints after data is populated
alter table recipe_ingredients
  alter column quantity set not null,
  alter column unit set not null;

alter table recipe_ingredients
  add constraint recipe_ingredients_quantity_positive check (quantity > 0),
  add constraint recipe_ingredients_unit_valid check (
    unit in (
      'mg', 'g', 'kg', 'oz', 'lb',
      'ml', 'l', 'tsp', 'tbsp', 'cup',
      'item', 'piece', 'slice', 'clove', 'can', 'pack'
    )
  );

-- 4. Drop the old column
alter table recipe_ingredients
  drop column quantity_grams;
