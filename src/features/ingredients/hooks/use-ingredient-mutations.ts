import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { StoredIngredient } from '../schemas/ingredient.schema';
import { ingredientRepository } from '../repositories/ingredient.repository';
import { queryKeys } from '@/shared/constants/query-keys';

export function useCreateIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ingredient: StoredIngredient) => {
      ingredientRepository.save(ingredient);
      return ingredient;
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
      ingredientRepository.save(ingredient);
      return ingredient;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ingredients.all });
    },
  });
}

export function useDeleteIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      ingredientRepository.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.ingredients.all });
    },
  });
}
