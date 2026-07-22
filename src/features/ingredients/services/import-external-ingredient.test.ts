import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { importExternalIngredient } from './import-external-ingredient';

vi.mock('@/infrastructure/supabase/client', () => ({
  getSupabaseClient: vi.fn(),
  getSupabaseClientOrNull: vi.fn(),
}));

const rpc = vi.fn();

const baseInput = {
  name: 'Chicken Breast',
  caloriesPer100g: 165,
  proteinPer100g: 31,
  carbsPer100g: 0,
  fatPer100g: 3.6,
  category: 'Protein',
  provider: 'usda' as const,
  externalId: '123',
  externalSourceName: 'Chicken Breast, meat only',
  approvedConversions: [],
};

const ingredientRow = {
  id: 'ing-1',
  user_id: 'user-1',
  name: 'Chicken Breast',
  normalized_name: 'chicken breast',
  calories_per_100g: 165,
  protein_per_100g: 31,
  carbs_per_100g: 0,
  fat_per_100g: 3.6,
  category: 'Protein',
  source: 'usda',
  external_source_id: '123',
  external_source_name: 'Chicken Breast, meat only',
  imported_at: '2026-07-22T00:00:00.000Z',
  created_at: '2026-07-22T00:00:00.000Z',
  updated_at: '2026-07-22T00:00:00.000Z',
};

beforeEach(() => {
  rpc.mockReset();
  vi.mocked(getSupabaseClient).mockReturnValue({ rpc } as unknown as ReturnType<typeof getSupabaseClient>);
});

describe('importExternalIngredient', () => {
  it('imports an ingredient with multiple conversions and preserves provenance', async () => {
    rpc.mockResolvedValue({
      data: {
        status: 'created',
        ingredient: ingredientRow,
        conversions: [
          {
            id: 'conv-1',
            user_id: 'user-1',
            ingredient_id: 'ing-1',
            unit: 'piece',
            label: '1 piece',
            grams_per_unit: 120,
            is_default: false,
            source_type: 'usda',
            external_source_id: '123',
            created_at: '2026-07-22T00:00:00.000Z',
            updated_at: '2026-07-22T00:00:00.000Z',
          },
          {
            id: 'conv-2',
            user_id: 'user-1',
            ingredient_id: 'ing-1',
            unit: 'slice',
            label: '1 slice',
            grams_per_unit: 30,
            is_default: false,
            source_type: 'usda',
            external_source_id: '123',
            created_at: '2026-07-22T00:00:00.000Z',
            updated_at: '2026-07-22T00:00:00.000Z',
          },
        ],
      },
      error: null,
    });

    const result = await importExternalIngredient({
      ...baseInput,
      approvedConversions: [
        { unit: 'piece', label: '1 piece', gramsPerUnit: 120, isDefault: false, sourceType: 'usda', externalSourceId: '123' },
        { unit: 'slice', label: '1 slice', gramsPerUnit: 30, isDefault: false, sourceType: 'usda', externalSourceId: '123' },
      ],
    });

    expect(result.status).toBe('created');
    if (result.status !== 'created') throw new Error('expected created result');
    expect(result.ingredient.source).toBe('usda');
    expect(result.ingredient.externalSourceId).toBe('123');
    expect(result.ingredient.externalSourceName).toBe('Chicken Breast, meat only');
    expect(result.ingredient.importedAt).toBeGreaterThan(0);
    expect(result.conversions).toHaveLength(2);
  });

  it('imports without conversions', async () => {
    rpc.mockResolvedValue({
      data: { status: 'created', ingredient: ingredientRow, conversions: [] },
      error: null,
    });

    const result = await importExternalIngredient(baseInput);

    expect(result.status).toBe('created');
    if (result.status !== 'created') throw new Error('expected created result');
    expect(result.conversions).toEqual([]);
  });

  it('returns a structured duplicate result', async () => {
    rpc.mockResolvedValue({
      data: { status: 'duplicate', ingredient: ingredientRow, conversions: [] },
      error: null,
    });

    const result = await importExternalIngredient(baseInput);

    expect(result.status).toBe('duplicate');
    if (result.status !== 'duplicate') throw new Error('expected duplicate result');
    expect(result.existingIngredient.id).toBe('ing-1');
  });

  it('rejects invalid nutrition before the RPC call', async () => {
    await expect(importExternalIngredient({ ...baseInput, caloriesPer100g: -1 })).rejects.toMatchObject({
      code: 'validation',
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it('rejects invalid conversions before the RPC call', async () => {
    await expect(importExternalIngredient({
      ...baseInput,
      approvedConversions: [
        { unit: 'piece', label: '1 piece', gramsPerUnit: -1, isDefault: false, sourceType: 'usda', externalSourceId: '123' },
      ],
    })).rejects.toMatchObject({
      code: 'validation',
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it('maps storage failures so the atomic insert can roll back', async () => {
    rpc.mockResolvedValue({
      data: { status: 'storage_error', message: 'duplicate key value violates unique constraint' },
      error: null,
    });

    await expect(importExternalIngredient(baseInput)).rejects.toMatchObject({
      code: 'storage',
    });
  });

  it('maps unauthenticated RPC errors', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'permission denied for function import_external_ingredient_atomic' },
    });

    await expect(importExternalIngredient(baseInput)).rejects.toMatchObject({
      code: 'unauthenticated',
    });
  });
});
