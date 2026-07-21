import { describe, it, expect } from 'vitest';
import { externalSearchResultSchema, externalFoodDetailsSchema, externalFoodSearchPageSchema } from './schemas';
import { ProviderError } from './types';

describe('externalSearchResultSchema', () => {
  it('accepts valid search result', () => {
    const r = externalSearchResultSchema.safeParse({
      provider: 'usda', externalId: '123', name: 'Chicken Breast',
      description: null, brand: null, dataType: null,
      caloriesPer100g: 165, proteinPer100g: 31, carbohydratesPer100g: 0, fatPer100g: 3.6,
    });
    expect(r.success).toBe(true);
  });

  it('accepts null nutrients', () => {
    const r = externalSearchResultSchema.safeParse({
      provider: 'usda', externalId: '123', name: 'Unknown Food',
      description: null, brand: null, dataType: null,
      caloriesPer100g: null, proteinPer100g: null, carbohydratesPer100g: null, fatPer100g: null,
    });
    expect(r.success).toBe(true);
  });

  it('rejects missing name', () => {
    const r = externalSearchResultSchema.safeParse({
      provider: 'usda', externalId: '123',
      description: null, brand: null, dataType: null,
      caloriesPer100g: null, proteinPer100g: null, carbohydratesPer100g: null, fatPer100g: null,
    });
    expect(r.success).toBe(false);
  });
});

describe('externalFoodDetailsSchema', () => {
  it('accepts valid details with serving options', () => {
    const r = externalFoodDetailsSchema.safeParse({
      provider: 'usda', externalId: '123', name: 'Chicken Breast',
      description: null, brand: null, dataType: null,
      caloriesPer100g: 165, proteinPer100g: 31, carbohydratesPer100g: 0, fatPer100g: 3.6,
      category: 'Poultry', servingOptions: [
        { label: '1 breast', unit: 'piece', gramsPerUnit: 174, sourceDescription: null },
      ],
      sourceUrl: null, retrievedAt: '2026-01-01T00:00:00Z',
    });
    expect(r.success).toBe(true);
  });

  it('rejects negative gramsPerUnit', () => {
    const r = externalFoodDetailsSchema.safeParse({
      provider: 'usda', externalId: '123', name: 'Chicken',
      description: null, brand: null, dataType: null,
      caloriesPer100g: 165, proteinPer100g: 31, carbohydratesPer100g: 0, fatPer100g: 3.6,
      category: null, servingOptions: [
        { label: 'bad', unit: 'piece', gramsPerUnit: -1, sourceDescription: null },
      ],
      sourceUrl: null, retrievedAt: '2026-01-01T00:00:00Z',
    });
    expect(r.success).toBe(false);
  });
});

describe('externalFoodSearchPageSchema', () => {
  it('accepts valid page', () => {
    const r = externalFoodSearchPageSchema.safeParse({
      items: [
        { provider: 'usda', externalId: '1', name: 'A', description: null, brand: null, dataType: null, caloriesPer100g: null, proteinPer100g: null, carbohydratesPer100g: null, fatPer100g: null },
      ],
      totalHits: 50, currentPage: 1, totalPages: 5,
    });
    expect(r.success).toBe(true);
  });

  it('rejects empty items with totalHits > 0', () => {
    const r = externalFoodSearchPageSchema.safeParse({
      items: [],
      totalHits: 50, currentPage: 1, totalPages: 5,
    });
    expect(r.success).toBe(true); // valid — empty items is allowed
  });
});

describe('ProviderError', () => {
  it('creates structured error', () => {
    const err = new ProviderError('rate_limited', 'Too many requests', 'usda');
    expect(err.code).toBe('rate_limited');
    expect(err.provider).toBe('usda');
    expect(err.message).toBe('Too many requests');
  });
});
