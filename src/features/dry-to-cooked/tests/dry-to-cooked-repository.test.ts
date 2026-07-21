import { describe, it, expect, beforeEach } from 'vitest';
import { dryToCookedRepository } from '../repositories/dry-to-cooked.repository';

const KEY = 'meal-prep-dry-cooked-v1';

beforeEach(() => {
  localStorage.removeItem(KEY);
});

function makeCalc(overrides: Record<string, unknown> = {}) {
  return {
    id: 'c1',
    name: 'Basmati Rice',
    dryWeight: 200,
    cookedWeight: 460,
    dryCaloriesPer100g: 355,
    dryProteinPer100g: 8,
    dryCarbsPer100g: 77,
    dryFatPer100g: 1,
    nutritionBasis: 100,
    portions: 4,
    dryServingWeight: 0,
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

describe('dryToCookedRepository', () => {
  describe('getAll', () => {
    it('returns empty when no storage', () => {
      expect(dryToCookedRepository.getAll()).toEqual([]);
    });

    it('returns valid calculations', () => {
      dryToCookedRepository.save(makeCalc());
      expect(dryToCookedRepository.getAll()).toHaveLength(1);
    });

    it('skips malformed JSON', () => {
      dryToCookedRepository.save(makeCalc());
      localStorage.setItem(KEY, 'not-json');
      expect(dryToCookedRepository.getAll()).toEqual([]);
    });

    it('skips invalid individual record', () => {
      const valid = makeCalc();
      dryToCookedRepository.save(valid);
      const raw = JSON.parse(localStorage.getItem(KEY)!);
      raw.push({ id: 'bad', invalid: true });
      localStorage.setItem(KEY, JSON.stringify(raw));
      const result = dryToCookedRepository.getAll();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('c1');
    });
  });

  describe('save', () => {
    it('stores source data only', () => {
      dryToCookedRepository.save(makeCalc());
      const raw = localStorage.getItem(KEY)!;
      expect(raw).toContain('dryWeight');
      expect(raw).not.toContain('yieldRatio');
      expect(raw).not.toContain('cookedCaloriesPer100g');
    });
  });

  describe('duplicate', () => {
    it('creates a copy with new id and name', () => {
      dryToCookedRepository.save(makeCalc());
      dryToCookedRepository.duplicate(makeCalc(), 'dup-id');
      const result = dryToCookedRepository.getAll();
      expect(result).toHaveLength(2);
      const dup = result.find((c) => c.id === 'dup-id');
      expect(dup).toBeDefined();
      expect(dup!.name).toBe('Basmati Rice (copy)');
    });
  });

  describe('delete', () => {
    it('removes the calculation', () => {
      dryToCookedRepository.save(makeCalc({ id: 'c1' }));
      dryToCookedRepository.save(makeCalc({ id: 'c2' }));
      dryToCookedRepository.delete('c1');
      expect(dryToCookedRepository.getAll()).toHaveLength(1);
    });
  });
});
