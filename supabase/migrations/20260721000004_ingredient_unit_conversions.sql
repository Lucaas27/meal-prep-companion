-- Ingredient-specific unit conversions.
-- Users define how many grams equal one unit of a specific ingredient.
-- Example: 1 tbsp of peanut butter = 16g.

create table ingredient_unit_conversions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ingredient_id uuid not null references ingredients(id) on delete cascade,
  unit text not null check (
    unit in ('ml', 'l', 'tsp', 'tbsp', 'cup', 'item', 'piece', 'slice', 'clove', 'can', 'pack')
  ),
  label text not null,
  grams_per_unit real not null check (grams_per_unit > 0),
  is_default boolean not null default false,
  source_type text not null default 'manual' check (source_type in ('manual', 'usda', 'open-food-facts')),
  external_source_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint unique_conversion_label unique (ingredient_id, label)
);

create trigger ingredient_unit_conversions_updated_at
  before update on ingredient_unit_conversions
  for each row execute function set_updated_at();

create index idx_iuc_ingredient on ingredient_unit_conversions(ingredient_id);
create index idx_iuc_user on ingredient_unit_conversions(user_id);

-- RLS
alter table ingredient_unit_conversions enable row level security;

create policy "Users can read conversions for their ingredients"
  on ingredient_unit_conversions for select
  using (
    exists (
      select 1 from ingredients
      where ingredients.id = ingredient_unit_conversions.ingredient_id
      and ingredients.user_id = auth.uid()
    )
  );

create policy "Users can create conversions for their ingredients"
  on ingredient_unit_conversions for insert
  with check (
    exists (
      select 1 from ingredients
      where ingredients.id = ingredient_unit_conversions.ingredient_id
      and ingredients.user_id = auth.uid()
    )
  );

create policy "Users can update conversions for their ingredients"
  on ingredient_unit_conversions for update
  using (
    exists (
      select 1 from ingredients
      where ingredients.id = ingredient_unit_conversions.ingredient_id
      and ingredients.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from ingredients
      where ingredients.id = ingredient_unit_conversions.ingredient_id
      and ingredients.user_id = auth.uid()
    )
  );

create policy "Users can delete conversions for their ingredients"
  on ingredient_unit_conversions for delete
  using (
    exists (
      select 1 from ingredients
      where ingredients.id = ingredient_unit_conversions.ingredient_id
      and ingredients.user_id = auth.uid()
    )
  );

-- Foreign key from recipe_ingredients (block deletion of in-use conversions)
alter table recipe_ingredients
  add constraint fk_recipe_ingredients_conversion
    foreign key (ingredient_unit_conversion_id)
    references ingredient_unit_conversions(id)
    on delete restrict;
