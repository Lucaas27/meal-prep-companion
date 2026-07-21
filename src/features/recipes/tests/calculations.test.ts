import { describe, it, expect } from 'vitest';
import {
  calcIngredientCalories,
  calcIngredientProtein,
  calcBatchTotals,
  calcPerPortion,
} from '../utils/calculations';

describe('calcIngredientCalories', () => {
  it('calculates calories from weight and per-100g value', () => {
    expect(calcIngredientCalories(200, 165)).toBe(330);
    expect(calcIngredientCalories(100, 165)).toBe(165);
    expect(calcIngredientCalories(50, 100)).toBe(50);
  });

  it('returns 0 for zero weight or zero calories', () => {
    expect(calcIngredientCalories(0, 165)).toBe(0);
    expect(calcIngredientCalories(200, 0)).toBe(0);
  });
});

describe('calcIngredientProtein', () => {
  it('calculates protein from weight and per-100g value', () => {
    expect(calcIngredientProtein(200, 31)).toBe(62);
    expect(calcIngredientProtein(100, 31)).toBe(31);
    expect(calcIngredientProtein(50, 10)).toBe(5);
  });

  it('returns 0 for zero weight or zero protein', () => {
    expect(calcIngredientProtein(0, 31)).toBe(0);
    expect(calcIngredientProtein(200, 0)).toBe(0);
  });
});

describe('calcBatchTotals', () => {
  it('sums totals across multiple ingredients', () => {
    const result = calcBatchTotals([
      { weight: 200, caloriesPer100g: 165, proteinPer100g: 31 },
      { weight: 200, caloriesPer100g: 135, proteinPer100g: 21 },
    ]);
    expect(result.totalWeight).toBe(400);
    expect(result.totalCalories).toBe(600);
    expect(result.totalProtein).toBe(104);
  });

  it('returns zeros for empty array', () => {
    const result = calcBatchTotals([]);
    expect(result.totalWeight).toBe(0);
    expect(result.totalCalories).toBe(0);
    expect(result.totalProtein).toBe(0);
  });

  it('skips zero-weight ingredients', () => {
    const result = calcBatchTotals([
      { weight: 0, caloriesPer100g: 165, proteinPer100g: 31 },
      { weight: 200, caloriesPer100g: 165, proteinPer100g: 31 },
    ]);
    expect(result.totalWeight).toBe(200);
    expect(result.totalCalories).toBe(330);
    expect(result.totalProtein).toBe(62);
  });
});

describe('calcPerPortion', () => {
  it('divides totals by portion count', () => {
    const per = calcPerPortion({ totalWeight: 400, totalCalories: 600, totalProtein: 104 }, 4);
    expect(per.weightPerPortion).toBe(100);
    expect(per.caloriesPerPortion).toBe(150);
    expect(per.proteinPerPortion).toBe(26);
  });

  it('handles 1 portion', () => {
    const per = calcPerPortion({ totalWeight: 400, totalCalories: 600, totalProtein: 104 }, 1);
    expect(per.weightPerPortion).toBe(400);
    expect(per.caloriesPerPortion).toBe(600);
    expect(per.proteinPerPortion).toBe(104);
  });
});
