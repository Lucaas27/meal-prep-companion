import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useImportExternalIngredient, useUpdateIngredient } from './use-ingredient-mutations';
import { queryKeys } from '@/shared/constants/query-keys';
import { importExternalIngredient } from '../services/import-external-ingredient';
import { supabaseIngredientRepository } from '../repositories/supabase-ingredient.repository';

vi.mock('../services/import-external-ingredient', () => ({
  importExternalIngredient: vi.fn(),
}));

vi.mock('../repositories/supabase-ingredient.repository', () => ({
  supabaseIngredientRepository: {
    save: vi.fn(),
  },
}));

vi.mock('@/infrastructure/supabase/client', () => ({
  getSupabaseClientOrNull: vi.fn(() => ({})),
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

describe('useUpdateIngredient', () => {
  it('invalidates recipes and planner totals after a nutrition update', async () => {
    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidateQueries = vi.spyOn(qc, 'invalidateQueries');

    vi.mocked(supabaseIngredientRepository.save).mockResolvedValue({
      id: 'ing-1',
      name: 'Chicken Breast',
      caloriesPer100g: 170,
      proteinPer100g: 32,
      carbsPer100g: 0,
      fatPer100g: 4,
      category: 'Protein',
      source: 'custom',
      externalSourceId: null,
      externalSourceName: null,
      importedAt: null,
      createdAt: 1,
      updatedAt: 2,
    });

    const { result } = renderHook(() => useUpdateIngredient(), { wrapper: wrapper(qc) });

    result.current.mutate({
      id: 'ing-1',
      name: 'Chicken Breast',
      caloriesPer100g: 170,
      proteinPer100g: 32,
      carbsPer100g: 0,
      fatPer100g: 4,
      category: 'Protein',
      source: 'custom',
      externalSourceId: null,
      externalSourceName: null,
      importedAt: null,
      createdAt: 1,
      updatedAt: 2,
    });

    await waitFor(() => expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.ingredients.all }));
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.recipes.all });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.mealPlan.all });
  });
});
