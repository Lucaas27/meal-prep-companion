import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { StoredIngredient } from '../schemas/ingredient.schema';
import { ingredientRepository } from '../repositories/ingredient.repository';
import { supabaseIngredientRepository } from '../repositories/supabase-ingredient.repository';
import { queryKeys } from '@/shared/constants/query-keys';
import { getSupabaseClientOrNull } from '@/infrastructure/supabase/client';

function getRepo() {
  return getSupabaseClientOrNull() ? supabaseIngredientRepository : ingredientRepository;
}

export function useCreateIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ingredient: StoredIngredient) => {
      return getRepo().save(ingredient);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ingredients.all });
    },
  });
}

export function useUpdateIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ingredient: StoredIngredient) => {
      return getRepo().save(ingredient);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ingredients.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all });
    },
  });
}

export function useDeleteIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await getRepo().delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ingredients.all });
    },
  });
}
