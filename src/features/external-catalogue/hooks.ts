import { useQuery } from '@tanstack/react-query';
import { searchFoods, getFoodDetails } from './client';

const KEYS = {
  search: ['external-food-search'] as const,
  details: ['external-food-details'] as const,
};

export function useFoodSearch(query: string, page = 1, pageSize = 20) {
  const trimmed = query.trim();
  const enabled = trimmed.length >= 2;

  return useQuery({
    queryKey: [...KEYS.search, trimmed, page, pageSize],
    queryFn: () => searchFoods(trimmed, page, pageSize),
    enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: (failureCount, error: Error) => {
      if (error.message?.includes('rate_limited')) return false;
      if (error.message?.includes('invalid_query')) return false;
      return failureCount < 1;
    },
  });
}

export function useFoodDetails(provider: string, externalId: string) {
  return useQuery({
    queryKey: [...KEYS.details, provider, externalId],
    queryFn: () => getFoodDetails(provider, externalId),
    enabled: !!provider && !!externalId,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: (failureCount, error: Error) => {
      if (error.message?.includes('not_found')) return false;
      return failureCount < 1;
    },
  });
}
