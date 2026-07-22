import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/constants/query-keys';
import { ingredientRepository } from '../repositories/ingredient.repository';
import { supabaseIngredientRepository } from '../repositories/supabase-ingredient.repository';
import { getSupabaseClientOrNull } from '@/infrastructure/supabase/client';
import { findImportedIngredient } from '../services/import-external-ingredient';

function getRepo() {
  return getSupabaseClientOrNull() ? supabaseIngredientRepository : ingredientRepository;
}

export function useIngredients() {
  return useQuery({
    queryKey: queryKeys.ingredients.all,
    queryFn: () => getRepo().getAll(),
  });
}

export function useImportedIngredientLookup(provider: string, externalId: string) {
  return useQuery({
    queryKey: queryKeys.ingredients.imported(provider, externalId),
    queryFn: () => findImportedIngredient(provider, externalId),
    enabled: !!provider && !!externalId,
  });
}
