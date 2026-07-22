import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { clearExternalFoodCache, getFoodByBarcode, getFoodDetails, searchFoods } from './client';
import { FunctionsHttpError } from '@supabase/supabase-js';

vi.mock('@/infrastructure/supabase/client', () => ({
  getSupabaseClient: vi.fn(),
}));

const invoke = vi.fn();

beforeEach(() => {
  localStorage.clear();
  invoke.mockReset();
  vi.mocked(getSupabaseClient).mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } }),
    },
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

  it('does not leak cached search results between users', async () => {
    invoke.mockResolvedValue({
      data: {
        items: [{ provider: 'usda', externalId: '123', name: 'Chicken Breast', description: null, brand: null, dataType: null, caloriesPer100g: 165, proteinPer100g: 31, carbohydratesPer100g: 0, fatPer100g: 3.6 }],
        totalHits: 1,
        currentPage: 1,
        totalPages: 1,
      },
      error: null,
    });

    await searchFoods('chicken', 1, 20);

    vi.mocked(getSupabaseClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user-2' } } }),
      },
      functions: { invoke },
    } as unknown as ReturnType<typeof getSupabaseClient>);

    await searchFoods('chicken', 1, 20);

    expect(invoke).toHaveBeenCalledTimes(2);
  });

  it('clears cached external food entries on sign-out', () => {
    localStorage.setItem('external-food-cache:v1:user-1:search:chicken:1:20', JSON.stringify({ expiresAt: Date.now() + 1000, data: {} }));
    localStorage.setItem('external-food-cache:v1:user-1:details:usda:123', JSON.stringify({ expiresAt: Date.now() + 1000, data: {} }));

    clearExternalFoodCache();

    expect(localStorage.length).toBe(0);
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

  it('looks up a barcode and preserves provider metadata', async () => {
    invoke.mockResolvedValue({
      data: {
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
      },
      error: null,
    });

    const result = await getFoodByBarcode({ barcode: '036000291452' });

    expect(result.provider).toBe('open-food-facts');
    expect(result.barcode).toBe('0036000291452');
    expect(invoke).toHaveBeenCalledWith('food-catalogue-barcode', {
      body: { barcode: '0036000291452' },
    });
  });

  it('maps structured 404 errors for barcode lookups', async () => {
    const response = new Response(JSON.stringify({ error: 'not_found', message: 'Barcode product not found.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
    invoke.mockResolvedValue({ data: null, error: new FunctionsHttpError(response) });

    await expect(getFoodByBarcode({ barcode: '036000291452' })).rejects.toMatchObject({ code: 'not_found' });
  });

  it('maps structured 429 errors for barcode lookups', async () => {
    const response = new Response(JSON.stringify({ error: 'rate_limited', message: 'Open Food Facts rate limit exceeded.' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
    invoke.mockResolvedValue({ data: null, error: new FunctionsHttpError(response) });

    await expect(getFoodByBarcode({ barcode: '036000291452' })).rejects.toMatchObject({ code: 'rate_limited' });
  });

  it('rejects invalid barcode input before invocation', async () => {
    await expect(getFoodByBarcode({ barcode: 'bad-code' })).rejects.toMatchObject({ code: 'invalid_query' });
    expect(invoke).not.toHaveBeenCalled();
  });
});
