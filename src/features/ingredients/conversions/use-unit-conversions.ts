import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UnitConversion } from './unit-conversion.schema';
import { unitConversionRepository } from './unit-conversion.repository';
import { queryKeys } from '@/shared/constants/query-keys';

const CONV_KEY = ['ingredient-unit-conversions'] as const;

export function useUnitConversions(ingredientId: string) {
  return useQuery({
    queryKey: [...CONV_KEY, ingredientId],
    queryFn: () => unitConversionRepository.listForIngredient(ingredientId),
    enabled: !!ingredientId,
  });
}

export function useCreateUnitConversion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (conv: UnitConversion) => unitConversionRepository.save(conv),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CONV_KEY });
      qc.invalidateQueries({ queryKey: queryKeys.recipes.all });
      qc.invalidateQueries({ queryKey: queryKeys.mealPlan.all });
    },
  });
}

export function useUpdateUnitConversion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (conv: UnitConversion) => unitConversionRepository.save(conv),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CONV_KEY });
      qc.invalidateQueries({ queryKey: queryKeys.recipes.all });
      qc.invalidateQueries({ queryKey: queryKeys.mealPlan.all });
    },
  });
}

export function useDeleteUnitConversion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => unitConversionRepository.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CONV_KEY });
    },
  });
}
