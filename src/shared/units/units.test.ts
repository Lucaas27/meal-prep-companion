import { describe, it, expect } from 'vitest';
import { unitSchema, isWeightUnit, UNIT_META, WEIGHT_UNITS, INGREDIENT_UNITS } from './types';
import { convertWeightToGrams, convertIngredientUnitToGrams } from './conversion';

describe('unitSchema', () => {
  it('accepts valid weight units', () => {
    expect(unitSchema.safeParse('g').success).toBe(true);
    expect(unitSchema.safeParse('kg').success).toBe(true);
    expect(unitSchema.safeParse('oz').success).toBe(true);
  });

  it('accepts valid ingredient units', () => {
    expect(unitSchema.safeParse('cup').success).toBe(true);
    expect(unitSchema.safeParse('tbsp').success).toBe(true);
    expect(unitSchema.safeParse('item').success).toBe(true);
  });

  it('rejects invalid units', () => {
    expect(unitSchema.safeParse('stone').success).toBe(false);
    expect(unitSchema.safeParse('').success).toBe(false);
  });
});

describe('isWeightUnit', () => {
  it('returns true for weight units', () => {
    expect(isWeightUnit('g')).toBe(true);
    expect(isWeightUnit('oz')).toBe(true);
  });

  it('returns false for ingredient units', () => {
    expect(isWeightUnit('cup')).toBe(false);
    expect(isWeightUnit('item')).toBe(false);
  });
});

describe('UNIT_META', () => {
  it('has metadata for all units', () => {
    const allIds = [...WEIGHT_UNITS, ...INGREDIENT_UNITS];
    for (const id of allIds) {
      expect(UNIT_META[id]).toBeDefined();
      expect(UNIT_META[id].abbr).toBeTruthy();
      expect(UNIT_META[id].singular).toBeTruthy();
      expect(UNIT_META[id].category).toBeTruthy();
    }
  });
});

describe('convertWeightToGrams', () => {
  it('converts milligrams to grams', () => {
    const r = convertWeightToGrams(1000, 'mg');
    expect(r.status).toBe('available');
    expect(r.grams).toBe(1);
  });

  it('converts grams to grams (identity)', () => {
    const r = convertWeightToGrams(200, 'g');
    expect(r.status).toBe('available');
    expect(r.grams).toBe(200);
  });

  it('converts kilograms to grams', () => {
    const r = convertWeightToGrams(1, 'kg');
    expect(r.status).toBe('available');
    expect(r.grams).toBe(1000);
  });

  it('converts ounces to grams', () => {
    const r = convertWeightToGrams(1, 'oz');
    expect(r.status).toBe('available');
    expect(r.grams).toBeCloseTo(28.35, 2);
  });

  it('converts pounds to grams', () => {
    const r = convertWeightToGrams(1, 'lb');
    expect(r.status).toBe('available');
    expect(r.grams).toBeCloseTo(453.59, 2);
  });

  it('handles zero quantity', () => {
    const r = convertWeightToGrams(0, 'kg');
    expect(r.status).toBe('available');
    expect(r.grams).toBe(0);
  });

  it('handles decimal quantities', () => {
    const r = convertWeightToGrams(1.5, 'kg');
    expect(r.status).toBe('available');
    expect(r.grams).toBe(1500);
  });

  it('rejects negative quantity', () => {
    const r = convertWeightToGrams(-1, 'g');
    expect(r.status).toBe('unavailable');
    expect(r.reason).toBe('invalid-quantity');
  });

  it('rejects NaN', () => {
    const r = convertWeightToGrams(NaN, 'g');
    expect(r.status).toBe('unavailable');
    expect(r.reason).toBe('invalid-quantity');
  });

  it('rejects Infinity', () => {
    const r = convertWeightToGrams(Infinity, 'g');
    expect(r.status).toBe('unavailable');
    expect(r.reason).toBe('invalid-quantity');
  });

  it('returns unavailable for non-weight unit producing NaN', () => {
    const r = convertWeightToGrams(1, 'cup' as never);
    expect(r.status).toBe('unavailable');
  });
});

describe('convertIngredientUnitToGrams', () => {
  it('returns unavailable when called without args', () => {
    const r = convertIngredientUnitToGrams();
    expect(r.status).toBe('unavailable');
  });

  it('converts with grams per unit', () => {
    const r = convertIngredientUnitToGrams(2, 13.5);
    expect(r.status).toBe('available');
    expect(r.grams).toBe(27);
  });

  it('handles zero quantity', () => {
    const r = convertIngredientUnitToGrams(0, 13.5);
    expect(r.status).toBe('available');
    expect(r.grams).toBe(0);
  });

  it('returns unavailable for negative gramsPerUnit', () => {
    const r = convertIngredientUnitToGrams(1, -1);
    expect(r.status).toBe('unavailable');
    expect(r.reason).toBe('missing-unit-conversion');
  });

  it('returns unavailable for zero gramsPerUnit', () => {
    const r = convertIngredientUnitToGrams(1, 0);
    expect(r.status).toBe('unavailable');
    expect(r.reason).toBe('missing-unit-conversion');
  });
});
