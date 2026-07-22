import { useQuery } from '@tanstack/react-query';
import { searchFoods, getFoodByBarcode, getFoodDetails } from './client';
import { queryKeys } from '@/shared/constants/query-keys';
import { normalizeBarcode } from './barcode';

function getProviderErrorCode(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
    ? error.code
    : null;
}

export function useFoodSearch(query: string, page = 1, pageSize = 20) {
  const trimmed = query.trim();
  const enabled = trimmed.length >= 2;

  return useQuery({
    queryKey: queryKeys.externalFood.search(trimmed, page, pageSize),
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
    queryKey: queryKeys.externalFood.detail(provider, externalId),
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

export function useFoodByBarcode(barcode: string) {
  const normalizedBarcode = normalizeBarcode(barcode);
  const enabled = !!normalizedBarcode;

  const query = useQuery({
    queryKey: queryKeys.externalFood.barcode(normalizedBarcode ?? ''),
    queryFn: () => getFoodByBarcode({ barcode: normalizedBarcode! }),
    enabled,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: (failureCount, error: Error) => {
      if (['invalid_query', 'unauthenticated', 'not_found', 'rate_limited'].includes(getProviderErrorCode(error) ?? '')) {
        return false;
      }
      return failureCount < 1;
    },
  });

  const lookupState = !barcode.trim() || !normalizedBarcode
    ? 'idle'
    : query.isPending
      ? 'looking_up'
      : query.isError
        ? getProviderErrorCode(query.error) === 'not_found'
          ? 'not_found'
          : getProviderErrorCode(query.error) === 'rate_limited'
            ? 'rate_limited'
            : 'unavailable'
        : query.data?.completenessStatus === 'complete'
          ? 'found'
          : 'incomplete';

  return {
    ...query,
    normalizedBarcode,
    isBarcodeValid: !!normalizedBarcode,
    lookupState,
  };
}
