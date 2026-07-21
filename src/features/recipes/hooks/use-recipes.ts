import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/constants/query-keys';
import { recipeRepository } from '../repositories/recipe.repository';

export function useRecipes() {
  return useQuery({
    queryKey: queryKeys.recipes.all,
    queryFn: () => recipeRepository.getAll(),
  });
}

export function useRecipe(id: string) {
  return useQuery({
    queryKey: queryKeys.recipes.detail(id),
    queryFn: () => recipeRepository.getById(id),
    enabled: !!id,
  });
}
