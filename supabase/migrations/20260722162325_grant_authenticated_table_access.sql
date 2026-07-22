grant usage on schema public to authenticated;

grant select, insert, update, delete on table public.ingredients to authenticated;
grant select, insert, update, delete on table public.ingredient_unit_conversions to authenticated;
grant select, insert, update, delete on table public.recipes to authenticated;
grant select, insert, update, delete on table public.recipe_ingredients to authenticated;
grant select, insert, update, delete on table public.dry_to_cooked_calculations to authenticated;
grant select, insert, update, delete on table public.meal_plan_entries to authenticated;
grant select, insert, delete on table public.data_migrations to authenticated;
