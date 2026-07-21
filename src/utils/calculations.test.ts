import { describe, it, expect } from 'vitest';
import {
  calcIngredientCalories,
  calcIngredientProtein,
  calcBatchTotals,
  calcPerPortion,
  calcRiceTotals,
  calcRicePer100g,
  calcRicePerPortion,
  round1dp,
} from './calculations';

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
    expect(result.totalCalories).toBe(600); // 330 + 270
    expect(result.totalProtein).toBe(104);  // 62 + 42
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
    const per = calcPerPortion(
      { totalWeight: 400, totalCalories: 600, totalProtein: 104 },
      4,
    );
    expect(per.weightPerPortion).toBe(100);
    expect(per.caloriesPerPortion).toBe(150);
    expect(per.proteinPerPortion).toBe(26);
  });

  it('handles 1 portion', () => {
    const per = calcPerPortion(
      { totalWeight: 400, totalCalories: 600, totalProtein: 104 },
      1,
    );
    expect(per.weightPerPortion).toBe(400);
    expect(per.caloriesPerPortion).toBe(600);
    expect(per.proteinPerPortion).toBe(104);
  });
});

describe('calcRiceTotals', () => {
  it('calculates totals from dry weight', () => {
    const result = calcRiceTotals({
      dryWeight: 200,
      dryCaloriesPer100g: 355,
      dryProteinPer100g: 8,
      cookedWeight: 460,
      portions: 4,
    });
    expect(result.totalCalories).toBe(710);
    expect(result.totalProtein).toBe(16);
  });
});

describe('calcRicePer100g', () => {
  it('calculates per-100g values from totals and cooked weight', () => {
    const result = calcRicePer100g(
      { totalCalories: 710, totalProtein: 16 },
      460,
    );
    expect(result.caloriesPer100gCooked).toBeCloseTo(154.3478, 3);
    expect(result.proteinPer100gCooked).toBeCloseTo(3.4782, 3);
  });
});

describe('calcRicePerPortion', () => {
  it('calculates per-portion values', () => {
    const result = calcRicePerPortion(
      { totalCalories: 710, totalProtein: 16 },
      460,
      4,
    );
    expect(result.gramsPerPortion).toBe(115);
    expect(result.caloriesPerPortion).toBe(177.5);
    expect(result.proteinPerPortion).toBe(4);
  });
});

describe('round1dp', () => {
  it('rounds to 1 decimal place', () => {
    expect(round1dp(3.14159)).toBe(3.1);
    expect(round1dp(2.789)).toBe(2.8);
    expect(round1dp(100)).toBe(100);
    expect(round1dp(0.05)).toBe(0.1);
    expect(round1dp(0.04)).toBe(0);
  });
});
