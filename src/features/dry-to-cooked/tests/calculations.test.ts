import { describe, it, expect } from 'vitest';
import { calcDryCookedTotals, calcDryCookedPer100g, calcDryCookedPerPortion } from '../utils/calculations';

describe('calcDryCookedTotals', () => {
  it('calculates totals from dry weight', () => {
    const result = calcDryCookedTotals({
      dryWeight: 200,
      dryCaloriesPer100g: 355,
      dryProteinPer100g: 8,
      dryCarbsPer100g: 77,
      dryFatPer100g: 1,
      cookedWeight: 460,
      portions: 4,
    });
    expect(result.totalCalories).toBe(710);
    expect(result.totalProtein).toBe(16);
    expect(result.totalCarbs).toBe(154);
    expect(result.totalFat).toBe(2);
  });
});

describe('calcDryCookedPer100g', () => {
  it('calculates per-100g values', () => {
    const result = calcDryCookedPer100g(
      { totalCalories: 710, totalProtein: 16, totalCarbs: 154, totalFat: 2 },
      460,
    );
    expect(result.caloriesPer100gCooked).toBeCloseTo(154.3478, 3);
    expect(result.proteinPer100gCooked).toBeCloseTo(3.4782, 3);
    expect(result.carbsPer100gCooked).toBeCloseTo(33.4782, 3);
    expect(result.fatPer100gCooked).toBeCloseTo(0.4347, 3);
  });
});

describe('calcDryCookedPerPortion', () => {
  it('calculates per-portion values', () => {
    const result = calcDryCookedPerPortion(
      { totalCalories: 710, totalProtein: 16, totalCarbs: 154, totalFat: 2 },
      460,
      4,
    );
    expect(result.gramsPerPortion).toBe(115);
    expect(result.caloriesPerPortion).toBe(177.5);
    expect(result.proteinPerPortion).toBe(4);
    expect(result.carbsPerPortion).toBe(38.5);
    expect(result.fatPerPortion).toBe(0.5);
  });
});
