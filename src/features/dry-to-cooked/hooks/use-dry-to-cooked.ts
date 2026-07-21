import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SavedCalculation } from '../schemas/saved-calculation.schema';
import { dryToCookedRepository } from '../repositories/dry-to-cooked.repository';
import { makeId } from '@/shared/lib/ids';

const KEY = ['dry-to-cooked'] as const;

export function useDryToCookedCalculations() {
  return useQuery({
    queryKey: KEY,
    queryFn: () => dryToCookedRepository.getAll(),
  });
}

export function useSaveDryToCookedCalculation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (calc: SavedCalculation) => {
      dryToCookedRepository.save(calc);
      return calc;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteDryToCookedCalculation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      dryToCookedRepository.delete(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDuplicateDryToCookedCalculation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (source: SavedCalculation) => {
      dryToCookedRepository.duplicate(source, makeId());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
