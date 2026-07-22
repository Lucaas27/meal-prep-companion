import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UnitConversion } from './unit-conversion.schema';
import { unitConversionRepository } from './unit-conversion.repository';
import { queryKeys } from '@/shared/constants/query-keys';

export function useUnitConversions(ingredientId: string) {
  return useQuery({
    queryKey: queryKeys.ingredientConversions.detail(ingredientId),
    queryFn: () => unitConversionRepository.listForIngredient(ingredientId),
    enabled: !!ingredientId,
  });
}

export function useConversionsForIngredients(ingredientIds: string[]) {
  const uniqueIds = [...new Set(ingredientIds)].filter(Boolean);
  return useQuery({
    queryKey: queryKeys.ingredientConversions.batch(uniqueIds),
    queryFn: async () => {
      const map = new Map<string, UnitConversion[]>();
      await Promise.all(
        uniqueIds.map(async (id) => {
          const convs = await unitConversionRepository.listForIngredient(id);
          map.set(id, convs);
        }),
      );
      return map;
    },
    enabled: uniqueIds.length > 0,
  });
}

export function useCreateUnitConversion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (conv: UnitConversion) => unitConversionRepository.save(conv),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.ingredientConversions.all });
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
      qc.invalidateQueries({ queryKey: queryKeys.ingredientConversions.all });
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
      qc.invalidateQueries({ queryKey: queryKeys.ingredientConversions.all });
    },
  });
}
