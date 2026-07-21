import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useFoodSearch, useFoodDetails } from './hooks';
import { searchFoods, getFoodDetails } from './client';
import type { ExternalFoodSearchPage, ExternalFoodDetails } from './types';

vi.mock('./client', () => ({
  searchFoods: vi.fn(),
  getFoodDetails: vi.fn(),
}));

const mockSearchFoods = vi.mocked(searchFoods);
const mockGetFoodDetails = vi.mocked(getFoodDetails);

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
