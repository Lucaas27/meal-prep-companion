import { describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useUpdateUnitConversion } from './use-unit-conversions';
import { unitConversionRepository } from './unit-conversion.repository';
import { queryKeys } from '@/shared/constants/query-keys';

vi.mock('./unit-conversion.repository', () => ({
  unitConversionRepository: {
    save: vi.fn(),
    delete: vi.fn(),
    listForIngredient: vi.fn(),
  },
}));

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe('useUpdateUnitConversion', () => {
  it('invalidates conversions, recipes, and planner totals', async () => {
    const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
    const invalidateQueries = vi.spyOn(qc, 'invalidateQueries');

    vi.mocked(unitConversionRepository.save).mockResolvedValue({
      id: 'conv-1',
      ingredientId: 'ing-1',
      unit: 'piece',
      label: '1 piece',
      gramsPerUnit: 120,
      isDefault: false,
      sourceType: 'manual',
      externalSourceId: null,
      createdAt: 1,
      updatedAt: 1,
    });

    const { result } = renderHook(() => useUpdateUnitConversion(), { wrapper: wrapper(qc) });

    result.current.mutate({
      id: 'conv-1',
      ingredientId: 'ing-1',
      unit: 'piece',
      label: '1 piece',
      gramsPerUnit: 120,
      isDefault: false,
      sourceType: 'manual',
      externalSourceId: null,
      createdAt: 1,
      updatedAt: 1,
    });

    await waitFor(() => expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.ingredientConversions.all }));
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.recipes.all });
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: queryKeys.mealPlan.all });
  });
});
