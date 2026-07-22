import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useImportExternalIngredient } from './use-ingredient-mutations';
import { queryKeys } from '@/shared/constants/query-keys';
import { importExternalIngredient } from '../services/import-external-ingredient';

vi.mock('../services/import-external-ingredient', () => ({
  importExternalIngredient: vi.fn(),
}));

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useImportExternalIngredient', () => {
  it('invalidates the ingredient catalogue and duplicate lookup queries', async () => {
    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidateQueries = vi.spyOn(qc, 'invalidateQueries');

    vi.mocked(importExternalIngredient).mockResolvedValue({
      status: 'created',
      ingredient: {
        id: 'ing-1',
        name: 'Chicken Breast',
        caloriesPer100g: 165,
        proteinPer100g: 31,
        carbsPer100g: 0,
        fatPer100g: 3.6,
        category: 'Protein',
        source: 'usda',
        externalSourceId: '123',
        externalSourceName: 'Chicken Breast',
        importedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      conversions: [],
    });

    const { result } = renderHook(() => useImportExternalIngredient(), { wrapper: wrapper(qc) });

    result.current.mutate({
      name: 'Chicken Breast',
      caloriesPer100g: 165,
      proteinPer100g: 31,
      carbsPer100g: 0,
      fatPer100g: 3.6,
      category: 'Protein',
      provider: 'usda',
      externalId: '123',
      externalSourceName: 'Chicken Breast',
      approvedConversions: [],
    });

    await waitFor(() => expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.ingredients.all }));
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.ingredients.imported('usda', '123') });
  });
});
