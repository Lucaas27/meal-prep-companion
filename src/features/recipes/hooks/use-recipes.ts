import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/constants/query-keys';
import { recipeRepository } from '../repositories/recipe.repository';
import { supabaseRecipeRepository } from '../repositories/supabase-recipe.repository';
import { getSupabaseClientOrNull } from '@/infrastructure/supabase/client';

function getRepo() {
  return getSupabaseClientOrNull() ? supabaseRecipeRepository : recipeRepository;
}

export function useRecipes() {
  return useQuery({
    queryKey: queryKeys.recipes.all,
    queryFn: () => getRepo().getAll(),
  });
}

export function useRecipe(id: string) {
  return useQuery({
    queryKey: queryKeys.recipes.detail(id),
    queryFn: () => getRepo().getById(id),
    enabled: !!id,
  });
}
