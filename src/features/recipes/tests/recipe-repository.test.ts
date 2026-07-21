import { describe, it, expect, beforeEach } from 'vitest';
import { recipeRepository } from '../repositories/recipe.repository';
import { storageKeys } from '@/shared/constants/storage-keys';

beforeEach(() => {
  localStorage.removeItem(storageKeys.recipes);
});

function makeRecipe(overrides: Record<string, unknown> = {}) {
  return {
    id: 'r1',
    name: 'Test Recipe',
    portions: 4,
    ingredients: [
      { id: 'i1', name: 'Chicken', weight: 200, caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
    ],
    createdAt: 1000,
    updatedAt: 1000,
    tags: [],
    favourite: false,
    notes: '',
    ...overrides,
  };
}

describe('recipeRepository', () => {
  describe('getAll', () => {
    it('returns empty array when no storage exists', () => {
      expect(recipeRepository.getAll()).toEqual([]);
    });

    it('returns valid recipes', () => {
      const recipe = makeRecipe();
      recipeRepository.save(recipe);
      const result = recipeRepository.getAll();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Test Recipe');
    });

    it('skips malformed JSON', () => {
      localStorage.setItem(storageKeys.recipes, 'not-json');
      expect(recipeRepository.getAll()).toEqual([]);
    });

    it('skips single invalid record', () => {
      const valid = makeRecipe();
      recipeRepository.save(valid);
      const raw = JSON.parse(localStorage.getItem(storageKeys.recipes)!);
      raw.push({ invalid: true });
      localStorage.setItem(storageKeys.recipes, JSON.stringify(raw));
      const result = recipeRepository.getAll();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('r1');
    });

    it('skips invalid array shape', () => {
      localStorage.setItem(storageKeys.recipes, JSON.stringify({ recipes: [] }));
      expect(recipeRepository.getAll()).toEqual([]);
    });
  });

  describe('save', () => {
    it('creates a new recipe', () => {
      recipeRepository.save(makeRecipe());
      expect(recipeRepository.getAll()).toHaveLength(1);
    });

    it('updates an existing recipe', () => {
      recipeRepository.save(makeRecipe());
      recipeRepository.save(makeRecipe({ name: 'Updated' }));
      const result = recipeRepository.getAll();
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Updated');
    });

    it('does not store calculated totals', () => {
      recipeRepository.save(makeRecipe());
      const raw = localStorage.getItem(storageKeys.recipes)!;
      expect(raw).not.toContain('totalCalories');
      expect(raw).not.toContain('totalProtein');
    });
  });

  describe('delete', () => {
    it('removes the recipe', () => {
      recipeRepository.save(makeRecipe({ id: 'r1' }));
      recipeRepository.save(makeRecipe({ id: 'r2' }));
      recipeRepository.delete('r1');
      const result = recipeRepository.getAll();
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('r2');
    });
  });

  describe('duplicate', () => {
    it('creates a copy with new id and name', () => {
      recipeRepository.save(makeRecipe());
      recipeRepository.duplicate(makeRecipe(), 'dup-id', 'Test Recipe (copy)', 2000);
      const result = recipeRepository.getAll();
      expect(result).toHaveLength(2);
      const dup = result.find((r) => r.id === 'dup-id');
      expect(dup).toBeDefined();
      expect(dup!.name).toBe('Test Recipe (copy)');
      expect(dup!.createdAt).toBe(2000);
    });
  });

  describe('clear', () => {
    it('removes all recipes', () => {
      recipeRepository.save(makeRecipe());
      recipeRepository.clear();
      expect(recipeRepository.getAll()).toEqual([]);
    });
  });
});
