import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { MealPlanEntry } from '../schemas/meal-plan.schema';
import { mealPlanRepository } from '../repositories/meal-plan.repository';
import { makeId } from '@/shared/lib/ids';

const KEY = ['meal-plan'] as const;

export function useMealPlanEntries(startDate: string, endDate: string) {
  return useQuery({
    queryKey: [...KEY, { startDate, endDate }],
    queryFn: () => mealPlanRepository.getByDateRange(startDate, endDate),
  });
}

export function useCreateMealPlanEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: MealPlanEntry) => {
      return mealPlanRepository.save(entry);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useUpdateMealPlanEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: MealPlanEntry) => {
      return mealPlanRepository.save(entry);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteMealPlanEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await mealPlanRepository.delete(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDuplicateMealPlanEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (source: MealPlanEntry) => {
      const dup: MealPlanEntry = { ...source, id: makeId(), createdAt: Date.now(), updatedAt: Date.now() };
      return mealPlanRepository.save(dup);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useMoveMealPlanEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: { id: string; plannedDate?: string; mealSlot?: MealPlanEntry['mealSlot']; position?: number }) => {
      const all = await mealPlanRepository.getAll();
      const entry = all.find((e) => e.id === params.id);
      if (!entry) throw new Error('Entry not found');
      const updated: MealPlanEntry = {
        ...entry,
        plannedDate: params.plannedDate ?? entry.plannedDate,
        mealSlot: params.mealSlot ?? entry.mealSlot,
        position: params.position ?? entry.position,
        updatedAt: Date.now(),
      };
      return mealPlanRepository.save(updated);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
