import { describe, it, expect } from 'vitest';
import { calcDryCookedTotals, calcDryCookedPer100g, calcDryCookedPerPortion } from '../utils/calculations';

describe('calcDryCookedTotals', () => {
  it('calculates totals from dry weight', () => {
    const result = calcDryCookedTotals({
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

describe('calcDryCookedPer100g', () => {
  it('calculates per-100g values from totals and cooked weight', () => {
    const result = calcDryCookedPer100g({ totalCalories: 710, totalProtein: 16 }, 460);
    expect(result.caloriesPer100gCooked).toBeCloseTo(154.3478, 3);
    expect(result.proteinPer100gCooked).toBeCloseTo(3.4782, 3);
  });
});

describe('calcDryCookedPerPortion', () => {
  it('calculates per-portion values', () => {
    const result = calcDryCookedPerPortion({ totalCalories: 710, totalProtein: 16 }, 460, 4);
    expect(result.gramsPerPortion).toBe(115);
    expect(result.caloriesPerPortion).toBe(177.5);
    expect(result.proteinPerPortion).toBe(4);
  });
});
