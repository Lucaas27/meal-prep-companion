import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/constants/query-keys';
import { ingredientRepository } from '../repositories/ingredient.repository';

export function useIngredients() {
  return useQuery({
    queryKey: queryKeys.ingredients.all,
    queryFn: () => ingredientRepository.getAll(),
  });
}
