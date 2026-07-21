import { describe, it, expect } from 'vitest';
import { ingredientSchema, recipeSchema } from '../schemas/recipe.schema';

describe('ingredientSchema', () => {
  it('accepts valid ingredient', () => {
    const result = ingredientSchema.safeParse({
      id: 'i1', name: 'Chicken', weight: 200, caloriesPer100g: 165, proteinPer100g: 31,
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative weight', () => {
    const result = ingredientSchema.safeParse({
      id: 'i1', name: 'Chicken', weight: -1, caloriesPer100g: 165, proteinPer100g: 31,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative calories', () => {
    const result = ingredientSchema.safeParse({
      id: 'i1', name: 'Chicken', weight: 200, caloriesPer100g: -1, proteinPer100g: 31,
    });
    expect(result.success).toBe(false);
  });

  it('applies default carbs and fat', () => {
    const result = ingredientSchema.parse({
      id: 'i1', name: 'Chicken', weight: 200, caloriesPer100g: 165, proteinPer100g: 31,
    });
    expect(result.carbsPer100g).toBe(0);
    expect(result.fatPer100g).toBe(0);
  });
});

describe('recipeSchema', () => {
  it('accepts valid recipe', () => {
    const result = recipeSchema.safeParse({
      id: 'r1', name: 'Test', portions: 4, ingredients: [
        { id: 'i1', name: 'Chicken', weight: 200, caloriesPer100g: 165, proteinPer100g: 31 },
      ], createdAt: 1000,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = recipeSchema.safeParse({
      id: 'r1', name: '', portions: 4, ingredients: [], createdAt: 1000,
    });
    expect(result.success).toBe(false);
  });

  it('rejects zero portions', () => {
    const result = recipeSchema.safeParse({
      id: 'r1', name: 'Test', portions: 0, ingredients: [
        { id: 'i1', name: 'Chicken', weight: 200, caloriesPer100g: 165, proteinPer100g: 31 },
      ], createdAt: 1000,
    });
    expect(result.success).toBe(false);
  });

  it('applies defaults for tags, favourite, notes, updatedAt', () => {
    const result = recipeSchema.parse({
      id: 'r1', name: 'Test', portions: 4, ingredients: [
        { id: 'i1', name: 'Chicken', weight: 200, caloriesPer100g: 165, proteinPer100g: 31 },
      ], createdAt: 1000,
    });
    expect(result.tags).toEqual([]);
    expect(result.favourite).toBe(false);
    expect(result.notes).toBe('');
    expect(result.updatedAt).toBe(0);
  });
});
