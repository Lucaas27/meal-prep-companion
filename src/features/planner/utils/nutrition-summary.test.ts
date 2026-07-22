import { describe, it, expect } from 'vitest';
import { calculateDayNutrition, calculateWeekNutrition, calculateDayAverages } from '../utils/nutrition-summary';
import type { MealPlanEntry } from '../schemas/meal-plan.schema';
import type { Recipe } from '@/features/recipes/schemas/recipe.schema';

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    id: 'r1',
    name: 'Chicken & Rice',
    portions: 4,
    ingredients: [
      { id: 'i1', name: 'Chicken', weight: 200, unit: 'g', unitConversionId: null, caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
      { id: 'i2', name: 'Rice', weight: 200, unit: 'g', unitConversionId: null, caloriesPer100g: 355, proteinPer100g: 8, carbsPer100g: 77, fatPer100g: 1 },
    ],
    createdAt: 1000,
    updatedAt: 1000,
    tags: [],
    favourite: false,
    notes: '',
    ...overrides,
  };
}

function makeEntry(overrides: Partial<MealPlanEntry> = {}): MealPlanEntry {
  return {
    id: 'e1',
    recipeId: 'r1',
    plannedDate: '2026-07-20',
    mealSlot: 'lunch',
    servings: 1,
    position: 0,
    notes: '',
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

function makeRecipeMap(recipes: Recipe[]): Map<string, Recipe> {
  const map = new Map<string, Recipe>();
  for (const r of recipes) map.set(r.id, r);
  return map;
}

describe('calculateDayNutrition', () => {
  const recipe = makeRecipe();
  const map = makeRecipeMap([recipe]);

  it('calculates totals for a single meal', () => {
    const result = calculateDayNutrition([makeEntry({ servings: 1 })], map);
    expect(result.calories).toBeCloseTo(260, 1);
    expect(result.protein).toBeCloseTo(19.5, 1);
    expect(result.carbs).toBeCloseTo(38.5, 1);
    expect(result.fat).toBeCloseTo(2.3, 1);
    expect(result.isComplete).toBe(true);
  });

  it('multiplies by servings', () => {
    const result = calculateDayNutrition([makeEntry({ servings: 2 })], map);
    expect(result.calories).toBeCloseTo(520, 1);
    expect(result.protein).toBeCloseTo(39, 1);
  });

  it('sums multiple meals', () => {
    const result = calculateDayNutrition([
      makeEntry({ id: 'e1', servings: 1 }),
      makeEntry({ id: 'e2', servings: 1 }),
    ], map);
    expect(result.calories).toBeCloseTo(520, 1);
  });

  it('reports missing recipes', () => {
    const empty = new Map<string, Recipe>();
    const result = calculateDayNutrition([makeEntry()], empty);
    expect(result.isComplete).toBe(false);
    expect(result.missingCount).toBe(1);
    expect(result.calories).toBe(0);
  });

  it('uses ingredient conversion maps for unit-based recipe servings', () => {
    const convertedRecipe = makeRecipe({
      ingredients: [
        { id: 'i1', name: 'Chicken', weight: 2, unit: 'piece', unitConversionId: 'conv-1', caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
      ],
    });
    const result = calculateDayNutrition([makeEntry()], makeRecipeMap([convertedRecipe]), new Map([['conv-1', 120]]));
    expect(result.calories).toBeCloseTo(99, 1);
    expect(result.protein).toBeCloseTo(18.6, 1);
    expect(result.isComplete).toBe(true);
  });

  it('marks incomplete when a referenced conversion is unavailable', () => {
    const convertedRecipe = makeRecipe({
      ingredients: [
        { id: 'i1', name: 'Chicken', weight: 2, unit: 'piece', unitConversionId: 'missing', caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
      ],
    });
    const result = calculateDayNutrition([makeEntry()], makeRecipeMap([convertedRecipe]));
    expect(result.isComplete).toBe(false);
    expect(result.missingCount).toBe(1);
  });
});

describe('calculateWeekNutrition', () => {
  const recipe = makeRecipe();
  const map = makeRecipeMap([recipe]);

  it('sums across multiple days', () => {
    const entries = [
      makeEntry({ id: 'e1', plannedDate: '2026-07-20', servings: 1 }),
      makeEntry({ id: 'e2', plannedDate: '2026-07-21', servings: 1 }),
    ];
    const result = calculateWeekNutrition(entries, map);
    expect(result.calories).toBeCloseTo(520, 1);
  });

  it('propagates unit-based recipe totals into weekly totals', () => {
    const convertedRecipe = makeRecipe({
      ingredients: [
        { id: 'i1', name: 'Chicken', weight: 2, unit: 'piece', unitConversionId: 'conv-1', caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
      ],
    });
    const entries = [makeEntry({ id: 'e1', servings: 2 })];
    const result = calculateWeekNutrition(entries, makeRecipeMap([convertedRecipe]), new Map([['conv-1', 120]]));
    expect(result.calories).toBeCloseTo(198, 1);
    expect(result.protein).toBeCloseTo(37.2, 1);
  });
});

describe('calculateDayAverages', () => {
  it('averages over days with meals', () => {
    const week = { calories: 520, protein: 39, carbs: 77, fat: 4.6, isComplete: true, missingCount: 0 };
    const result = calculateDayAverages(week, 2);
    expect(result!.calories).toBeCloseTo(260, 1);
    expect(result!.protein).toBeCloseTo(19.5, 1);
  });

  it('returns null for zero days', () => {
    const week = { calories: 0, protein: 0, carbs: 0, fat: 0, isComplete: true, missingCount: 0 };
    expect(calculateDayAverages(week, 0)).toBeNull();
  });
});
