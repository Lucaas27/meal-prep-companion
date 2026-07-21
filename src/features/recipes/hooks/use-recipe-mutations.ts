import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Recipe } from '../schemas/recipe.schema';
import { recipeRepository } from '../repositories/recipe.repository';
import { queryKeys } from '@/shared/constants/query-keys';
import { makeId } from '@/shared/lib/ids';

export function useCreateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipe: Recipe) => {
      recipeRepository.save(recipe);
      return recipe;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all });
    },
  });
}

export function useUpdateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipe: Recipe) => {
      recipeRepository.save(recipe);
      return recipe;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all });
    },
  });
}

export function useDeleteRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      recipeRepository.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all });
    },
  });
}

export function useDuplicateRecipe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recipe: Recipe) => {
      const newId = makeId();
      const newName = `${recipe.name} (copy)`;
      recipeRepository.duplicate(recipe, newId, newName, Date.now());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all });
    },
  });
}
