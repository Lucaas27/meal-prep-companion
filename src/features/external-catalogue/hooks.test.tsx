import { beforeEach, describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useFoodSearch, useFoodDetails, useFoodByBarcode } from './hooks';
import { searchFoods, getFoodByBarcode, getFoodDetails } from './client';
import { ProviderError, type ExternalBarcodeFoodDetails, type ExternalFoodSearchPage, type ExternalFoodDetails } from './types';

vi.mock('./client', () => ({
  searchFoods: vi.fn(),
  getFoodDetails: vi.fn(),
  getFoodByBarcode: vi.fn(),
}));

const mockSearchFoods = vi.mocked(searchFoods);
const mockGetFoodDetails = vi.mocked(getFoodDetails);
const mockGetFoodByBarcode = vi.mocked(getFoodByBarcode);

beforeEach(() => {
  vi.clearAllMocks();
});

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

const mockPage: ExternalFoodSearchPage = {
  items: [
    {
      provider: 'usda', externalId: '123', name: 'Chicken Breast',
      description: null, brand: null, dataType: null,
      caloriesPer100g: 165, proteinPer100g: 31, carbohydratesPer100g: 0, fatPer100g: 3.6,
    },
  ],
  totalHits: 1,
  currentPage: 1,
  totalPages: 1,
};

const mockDetails: ExternalFoodDetails = {
  provider: 'usda', externalId: '123', name: 'Chicken Breast',
  description: null, brand: null, dataType: 'Foundation',
  caloriesPer100g: 165, proteinPer100g: 31, carbohydratesPer100g: 0, fatPer100g: 3.6,
  category: 'Poultry', servingOptions: [], sourceUrl: null, retrievedAt: '2026-01-01T00:00:00Z',
};

const mockBarcodeDetails: ExternalBarcodeFoodDetails = {
  provider: 'open-food-facts',
  externalId: '0036000291452',
  barcode: '0036000291452',
  name: 'Example Product',
  description: null,
  brand: 'Example Brand',
  dataType: 'packaged-food',
  caloriesPer100g: 250,
  proteinPer100g: 6,
  carbohydratesPer100g: 30,
  fatPer100g: 10,
  fibrePer100g: null,
  saltPer100g: 0.4,
  sodiumPer100g: null,
  category: 'Snack',
  servingOptions: [],
  sourceUrl: 'https://world.openfoodfacts.org/product/0036000291452',
  retrievedAt: '2026-01-01T00:00:00Z',
  imageUrl: null,
  packageQuantityText: '500 g',
  servingSizeText: '30 g',
  servingQuantityGrams: 30,
  completenessStatus: 'complete',
};

describe('useFoodSearch', () => {
  it('does not search for blank input', () => {
    mockSearchFoods.mockResolvedValue(mockPage);
    const { result } = renderHook(() => useFoodSearch(''), { wrapper });
    expect(result.current.isLoading).toBe(false);
    expect(mockSearchFoods).not.toHaveBeenCalled();
  });

  it('does not search for single character', () => {
    mockSearchFoods.mockResolvedValue(mockPage);
    const { result } = renderHook(() => useFoodSearch('a'), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('searches for query >= 2 chars', async () => {
    mockSearchFoods.mockResolvedValue(mockPage);
    const { result } = renderHook(() => useFoodSearch('chicken'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items[0].name).toBe('Chicken Breast');
  });
});

describe('useFoodDetails', () => {
  it('loads details by external ID', async () => {
    mockGetFoodDetails.mockResolvedValue(mockDetails);
    const { result } = renderHook(() => useFoodDetails('usda', '123'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.name).toBe('Chicken Breast');
  });

  it('disables when externalId is empty', () => {
    mockGetFoodDetails.mockResolvedValue(mockDetails);
    const { result } = renderHook(() => useFoodDetails('usda', ''), { wrapper });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useFoodByBarcode', () => {
  it('stays idle until a valid barcode is supplied', () => {
    mockGetFoodByBarcode.mockResolvedValue(mockBarcodeDetails);
    const { result } = renderHook(() => useFoodByBarcode('bad-code'), { wrapper });
    expect(result.current.lookupState).toBe('idle');
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockGetFoodByBarcode).not.toHaveBeenCalled();
  });

  it('looks up a valid barcode once and returns found state', async () => {
    mockGetFoodByBarcode.mockResolvedValue(mockBarcodeDetails);
    const { result } = renderHook(() => useFoodByBarcode('036000291452'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.lookupState).toBe('found');
    expect(result.current.normalizedBarcode).toBe('0036000291452');
  });

  it('returns incomplete state for partial products', async () => {
    mockGetFoodByBarcode.mockResolvedValue({ ...mockBarcodeDetails, completenessStatus: 'partial' });
    const { result } = renderHook(() => useFoodByBarcode('036000291452'), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.lookupState).toBe('incomplete');
  });

  it('does not retry 404 lookups', async () => {
    mockGetFoodByBarcode.mockRejectedValue(new ProviderError('not_found', 'Barcode product not found.', 'open-food-facts'));
    const { result } = renderHook(() => useFoodByBarcode('036000291452'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.lookupState).toBe('not_found');
    expect(mockGetFoodByBarcode).toHaveBeenCalledTimes(1);
  });

  it('reports rate limited state without retries', async () => {
    mockGetFoodByBarcode.mockRejectedValue(new ProviderError('rate_limited', 'Rate limited', 'open-food-facts'));
    const { result } = renderHook(() => useFoodByBarcode('036000291452'), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.lookupState).toBe('rate_limited');
    expect(mockGetFoodByBarcode).toHaveBeenCalledTimes(1);
  });
});
