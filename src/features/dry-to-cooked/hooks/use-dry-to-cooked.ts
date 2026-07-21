import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SavedCalculation } from '../schemas/saved-calculation.schema';
import { dryToCookedRepository } from '../repositories/dry-to-cooked.repository';
import { supabaseCalcRepository } from '../repositories/supabase-calc.repository';
import { makeId } from '@/shared/lib/ids';
import { getSupabaseClientOrNull } from '@/infrastructure/supabase/client';
import { queryKeys } from '@/shared/constants/query-keys';

function getRepo() {
  return getSupabaseClientOrNull() ? supabaseCalcRepository : dryToCookedRepository;
}

export function useDryToCookedCalculations() {
  return useQuery({
    queryKey: queryKeys.dryToCooked.all,
    queryFn: () => getRepo().getAll(),
  });
}

export function useSaveDryToCookedCalculation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (calc: SavedCalculation) => {
      return getRepo().save(calc);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.dryToCooked.all }),
  });
}

export function useDeleteDryToCookedCalculation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await getRepo().delete(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.dryToCooked.all }),
  });
}

export function useDuplicateDryToCookedCalculation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (source: SavedCalculation) => {
      await getRepo().duplicate(source, makeId());
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.dryToCooked.all }),
  });
}
