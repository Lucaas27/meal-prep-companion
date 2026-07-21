-- Row Level Security policies for all application tables.
-- Every root table restricts access to auth.uid() = user_id.
-- Child tables verify ownership through their parent record.

-- ============================================================================
-- Enable RLS on all tables
-- ============================================================================
alter table ingredients enable row level security;
alter table recipes enable row level security;
alter table recipe_ingredients enable row level security;
alter table dry_to_cooked_calculations enable row level security;
alter table meal_plan_entries enable row level security;
alter table data_migrations enable row level security;

-- ============================================================================
-- ingredients
-- ============================================================================
create policy "Users can read their own ingredients"
  on ingredients for select
  using (auth.uid() = user_id);

create policy "Users can create their own ingredients"
  on ingredients for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own ingredients"
  on ingredients for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own ingredients"
  on ingredients for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- recipes
-- ============================================================================
create policy "Users can read their own recipes"
  on recipes for select
  using (auth.uid() = user_id);

create policy "Users can create their own recipes"
  on recipes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own recipes"
  on recipes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own recipes"
  on recipes for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- recipe_ingredients
-- Ownership verified through parent recipe's user_id
-- ============================================================================
create policy "Users can read recipe ingredients for their recipes"
  on recipe_ingredients for select
  using (
    exists (
      select 1 from recipes
      where recipes.id = recipe_ingredients.recipe_id
      and recipes.user_id = auth.uid()
    )
  );

create policy "Users can create recipe ingredients for their recipes"
  on recipe_ingredients for insert
  with check (
    exists (
      select 1 from recipes
      where recipes.id = recipe_ingredients.recipe_id
      and recipes.user_id = auth.uid()
    )
  );

create policy "Users can update recipe ingredients for their recipes"
  on recipe_ingredients for update
  using (
    exists (
      select 1 from recipes
      where recipes.id = recipe_ingredients.recipe_id
      and recipes.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from recipes
      where recipes.id = recipe_ingredients.recipe_id
      and recipes.user_id = auth.uid()
    )
  );

create policy "Users can delete recipe ingredients for their recipes"
  on recipe_ingredients for delete
  using (
    exists (
      select 1 from recipes
      where recipes.id = recipe_ingredients.recipe_id
      and recipes.user_id = auth.uid()
    )
  );

-- ============================================================================
-- dry_to_cooked_calculations
-- ============================================================================
create policy "Users can read their own calculations"
  on dry_to_cooked_calculations for select
  using (auth.uid() = user_id);

create policy "Users can create their own calculations"
  on dry_to_cooked_calculations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own calculations"
  on dry_to_cooked_calculations for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own calculations"
  on dry_to_cooked_calculations for delete
  using (auth.uid() = user_id);

-- ============================================================================
-- meal_plan_entries
-- Ownership verified through parent recipe's user_id
-- ============================================================================
create policy "Users can read their own meal plan entries"
  on meal_plan_entries for select
  using (
    exists (
      select 1 from recipes
      where recipes.id = meal_plan_entries.recipe_id
      and recipes.user_id = auth.uid()
    )
  );

create policy "Users can create their own meal plan entries"
  on meal_plan_entries for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from recipes
      where recipes.id = meal_plan_entries.recipe_id
      and recipes.user_id = auth.uid()
    )
  );

create policy "Users can update their own meal plan entries"
  on meal_plan_entries for update
  using (
    exists (
      select 1 from recipes
      where recipes.id = meal_plan_entries.recipe_id
      and recipes.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from recipes
      where recipes.id = meal_plan_entries.recipe_id
      and recipes.user_id = auth.uid()
    )
  );

create policy "Users can delete their own meal plan entries"
  on meal_plan_entries for delete
  using (
    exists (
      select 1 from recipes
      where recipes.id = meal_plan_entries.recipe_id
      and recipes.user_id = auth.uid()
    )
  );

-- ============================================================================
-- data_migrations
-- ============================================================================
create policy "Users can read their own migration records"
  on data_migrations for select
  using (auth.uid() = user_id);

create policy "Users can create their own migration records"
  on data_migrations for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own migration records"
  on data_migrations for delete
  using (auth.uid() = user_id);
