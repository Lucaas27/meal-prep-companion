import { describe, it, expect } from 'vitest';
import {
  calcIngredientCalories,
  calcIngredientProtein,
  calcIngredientCarbs,
  calcIngredientFat,
  calcBatchTotals,
  calcPerPortion,
} from '../utils/calculations';

describe('calcIngredientCalories', () => {
  it('calculates calories from weight and per-100g value', () => {
    expect(calcIngredientCalories(200, 165)).toBe(330);
    expect(calcIngredientCalories(100, 165)).toBe(165);
  });

  it('returns 0 for zero weight or zero calories', () => {
    expect(calcIngredientCalories(0, 165)).toBe(0);
    expect(calcIngredientCalories(200, 0)).toBe(0);
  });
});

describe('calcIngredientProtein', () => {
  it('calculates protein', () => {
    expect(calcIngredientProtein(200, 31)).toBe(62);
  });

  it('returns 0 for zero', () => {
    expect(calcIngredientProtein(0, 31)).toBe(0);
    expect(calcIngredientProtein(200, 0)).toBe(0);
  });
});

describe('calcIngredientCarbs', () => {
  it('calculates carbs', () => {
    expect(calcIngredientCarbs(200, 77)).toBe(154);
  });

  it('returns 0 for zero', () => {
    expect(calcIngredientCarbs(0, 77)).toBe(0);
    expect(calcIngredientCarbs(200, 0)).toBe(0);
  });
});

describe('calcIngredientFat', () => {
  it('calculates fat', () => {
    expect(calcIngredientFat(200, 10)).toBe(20);
  });

  it('returns 0 for zero', () => {
    expect(calcIngredientFat(0, 10)).toBe(0);
    expect(calcIngredientFat(200, 0)).toBe(0);
  });
});

describe('calcBatchTotals', () => {
  it('sums totals across multiple ingredients', () => {
    const result = calcBatchTotals([
      { weight: 200, caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
      { weight: 200, caloriesPer100g: 355, proteinPer100g: 8, carbsPer100g: 77, fatPer100g: 1 },
    ]);
    expect(result.totalWeight).toBe(400);
    expect(result.totalCalories).toBe(1040);
    expect(result.totalProtein).toBe(78);
    expect(result.totalCarbs).toBe(154);
    expect(result.totalFat).toBe(9.2);
    expect(result.isComplete).toBe(true);
  });

  it('converts kilograms to grams', () => {
    const result = calcBatchTotals([
      { weight: 1, unit: 'kg', caloriesPer100g: 100, proteinPer100g: 10, carbsPer100g: 5, fatPer100g: 2 },
    ]);
    expect(result.totalWeight).toBe(1000);
    expect(result.totalCalories).toBe(1000); // (1000/100)*100
  });

  it('converts ounces to grams', () => {
    const result = calcBatchTotals([
      { weight: 1, unit: 'oz', caloriesPer100g: 100, proteinPer100g: 10, carbsPer100g: 5, fatPer100g: 2 },
    ]);
    expect(result.totalWeight).toBeCloseTo(28.35, 1);
    expect(result.totalCalories).toBeCloseTo(28.35, 1);
  });

  it('marks ingredient-specific units as incomplete', () => {
    const result = calcBatchTotals([
      { weight: 1, unit: 'cup', caloriesPer100g: 100, proteinPer100g: 10, carbsPer100g: 5, fatPer100g: 2 },
    ]);
    expect(result.isComplete).toBe(false);
    expect(result.incompleteCount).toBe(1);
    expect(result.totalCalories).toBe(0);
  });

  it('handles mixed units', () => {
    const result = calcBatchTotals([
      { weight: 1, unit: 'kg', caloriesPer100g: 100, proteinPer100g: 10, carbsPer100g: 5, fatPer100g: 2 },
      { weight: 200, unit: 'g', caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
    ]);
    expect(result.totalWeight).toBe(1200);
    expect(result.isComplete).toBe(true);
  });

  it('returns zeros for empty array', () => {
    const result = calcBatchTotals([]);
    expect(result.totalWeight).toBe(0);
    expect(result.totalCalories).toBe(0);
    expect(result.totalProtein).toBe(0);
    expect(result.totalCarbs).toBe(0);
    expect(result.totalFat).toBe(0);
  });

  it('skips zero-weight ingredients', () => {
    const result = calcBatchTotals([
      { weight: 0, caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
      { weight: 200, caloriesPer100g: 165, proteinPer100g: 31, carbsPer100g: 0, fatPer100g: 3.6 },
    ]);
    expect(result.totalWeight).toBe(200);
    expect(result.totalCalories).toBe(330);
    expect(result.totalProtein).toBe(62);
  });
});

describe('calcPerPortion', () => {
  it('divides totals by portion count', () => {
    const per = calcPerPortion(
      { totalWeight: 400, totalCalories: 600, totalProtein: 104, totalCarbs: 0, totalFat: 0, isComplete: true, incompleteCount: 0 },
      4,
    );
    expect(per.weightPerPortion).toBe(100);
    expect(per.caloriesPerPortion).toBe(150);
    expect(per.proteinPerPortion).toBe(26);
    expect(per.carbsPerPortion).toBe(0);
    expect(per.fatPerPortion).toBe(0);
  });

  it('handles 1 portion', () => {
    const per = calcPerPortion(
      { totalWeight: 400, totalCalories: 1040, totalProtein: 78, totalCarbs: 154, totalFat: 9.2, isComplete: true, incompleteCount: 0 },
      1,
    );
    expect(per.weightPerPortion).toBe(400);
    expect(per.caloriesPerPortion).toBe(1040);
    expect(per.proteinPerPortion).toBe(78);
  });
});
