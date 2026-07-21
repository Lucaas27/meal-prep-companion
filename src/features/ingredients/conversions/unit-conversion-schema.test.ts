import { describe, it, expect } from 'vitest';
import { unitConversionSchema } from './unit-conversion.schema';

describe('unitConversionSchema', () => {
  it('accepts valid conversion', () => {
    const result = unitConversionSchema.safeParse({
      id: 'c1', ingredientId: 'i1', unit: 'tbsp', label: '1 tbsp',
      gramsPerUnit: 13.5, isDefault: false, createdAt: 1000,
    });
    expect(result.success).toBe(true);
  });

  it('rejects weight unit as conversion unit', () => {
    const result = unitConversionSchema.safeParse({
      id: 'c1', ingredientId: 'i1', unit: 'oz', label: '1 oz',
      gramsPerUnit: 28.35, createdAt: 1000,
    });
    expect(result.success).toBe(false);
  });

  it('rejects zero grams per unit', () => {
    const result = unitConversionSchema.safeParse({
      id: 'c1', ingredientId: 'i1', unit: 'cup', label: '1 cup',
      gramsPerUnit: 0, createdAt: 1000,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative grams per unit', () => {
    const result = unitConversionSchema.safeParse({
      id: 'c1', ingredientId: 'i1', unit: 'cup', label: '1 cup',
      gramsPerUnit: -1, createdAt: 1000,
    });
    expect(result.success).toBe(false);
  });

  it('applies defaults', () => {
    const result = unitConversionSchema.parse({
      id: 'c1', ingredientId: 'i1', unit: 'tsp', label: '1 tsp',
      gramsPerUnit: 5, createdAt: 1000,
    });
    expect(result.isDefault).toBe(false);
    expect(result.sourceType).toBe('manual');
    expect(result.externalSourceId).toBeNull();
    expect(result.updatedAt).toBe(0);
  });
});
