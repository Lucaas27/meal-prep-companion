import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { getFoodDetails, searchFoods } from './client';

vi.mock('@/infrastructure/supabase/client', () => ({
  getSupabaseClient: vi.fn(),
}));

const invoke = vi.fn();

beforeEach(() => {
  localStorage.clear();
  invoke.mockReset();
  vi.mocked(getSupabaseClient).mockReturnValue({
    functions: { invoke },
  } as unknown as ReturnType<typeof getSupabaseClient>);
});

describe('external catalogue cache', () => {
  it('reuses cached search results for 3 days', async () => {
    invoke.mockResolvedValue({
      data: {
        items: [
          {
            provider: 'usda',
            externalId: '123',
            name: 'Chicken Breast',
            description: null,
            brand: null,
            dataType: null,
            caloriesPer100g: 165,
            proteinPer100g: 31,
            carbohydratesPer100g: 0,
            fatPer100g: 3.6,
          },
        ],
        totalHits: 1,
        currentPage: 1,
        totalPages: 1,
      },
      error: null,
    });

    await searchFoods('chicken', 1, 20);
    await searchFoods('chicken', 1, 20);

    expect(invoke).toHaveBeenCalledTimes(1);
  });

  it('refetches details after the cache expires', async () => {
    vi.useFakeTimers();
    try {
      invoke.mockResolvedValue({
        data: {
          provider: 'usda',
          externalId: '123',
          name: 'Chicken Breast',
          description: null,
          brand: null,
          dataType: 'Foundation',
          caloriesPer100g: 165,
          proteinPer100g: 31,
          carbohydratesPer100g: 0,
          fatPer100g: 3.6,
          category: 'Poultry',
          servingOptions: [],
          sourceUrl: null,
          retrievedAt: '2026-01-01T00:00:00Z',
        },
        error: null,
      });

      await getFoodDetails('usda', '123');
      vi.advanceTimersByTime(3 * 24 * 60 * 60 * 1000 + 1);
      await getFoodDetails('usda', '123');

      expect(invoke).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
