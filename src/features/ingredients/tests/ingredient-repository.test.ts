import { describe, it, expect, beforeEach } from 'vitest';
import { ingredientRepository } from '../repositories/ingredient.repository';
import { storageKeys } from '@/shared/constants/storage-keys';

beforeEach(() => {
  localStorage.removeItem(storageKeys.ingredients);
});

function makeIngredient(overrides: Record<string, unknown> = {}) {
  return {
    id: 'ing-1',
    name: 'Custom Ingredient',
    caloriesPer100g: 100,
    proteinPer100g: 10,
    carbsPer100g: 5,
    fatPer100g: 2,
    category: 'Protein',
    source: 'custom' as const,
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

describe('ingredientRepository', () => {
  describe('getAll', () => {
    it('seeds starters when storage is missing', () => {
      const result = ingredientRepository.getAll();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].source).toBe('starter');
    });

    it('respects an intentionally empty array', () => {
      localStorage.setItem(storageKeys.ingredients, '[]');
      const result = ingredientRepository.getAll();
      expect(result).toEqual([]);
    });

    it('skips malformed JSON', () => {
      localStorage.setItem(storageKeys.ingredients, 'not-json');
      const result = ingredientRepository.getAll();
      expect(result).toEqual([]);
    });
  });

  describe('existsByNormalisedName', () => {
    it('detects duplicates case-insensitively', () => {
      ingredientRepository.save(makeIngredient({ name: 'Chicken Breast' }));
      expect(ingredientRepository.existsByNormalisedName('chicken breast')).toBe(true);
      expect(ingredientRepository.existsByNormalisedName('CHICKEN BREAST')).toBe(true);
      expect(ingredientRepository.existsByNormalisedName('  Chicken  Breast  ')).toBe(true);
    });

    it('allows different names', () => {
      expect(ingredientRepository.existsByNormalisedName('Beef Mince')).toBe(false);
    });

    it('excludes specified id', () => {
      ingredientRepository.save(makeIngredient({ id: 'ing-99', name: 'Unique Food' }));
      expect(ingredientRepository.existsByNormalisedName('Unique Food', 'ing-99')).toBe(false);
      expect(ingredientRepository.existsByNormalisedName('Unique Food')).toBe(true);
    });
  });

  describe('save', () => {
    it('sets timestamps on create', () => {
      ingredientRepository.save(makeIngredient({ createdAt: 0, updatedAt: 0 }));
      const all = ingredientRepository.getAll();
      const saved = all.find((i) => i.id === 'ing-1')!;
      expect(saved.createdAt).toBeGreaterThan(0);
      expect(saved.updatedAt).toBeGreaterThan(0);
    });
  });

  describe('delete', () => {
    it('removes the ingredient', () => {
      ingredientRepository.save(makeIngredient({ id: 'ing-1' }));
      expect(ingredientRepository.getAll().some((i) => i.id === 'ing-1')).toBe(true);
      ingredientRepository.delete('ing-1');
      expect(ingredientRepository.getAll().some((i) => i.id === 'ing-1')).toBe(false);
    });
  });

  describe('clear', () => {
    it('removes all then reseeds', () => {
      ingredientRepository.save(makeIngredient());
      ingredientRepository.clear();
      const result = ingredientRepository.getAll();
      expect(result.length).toBeGreaterThan(0);
      expect(result.every((i) => i.source === 'starter')).toBe(true);
    });
  });
});
