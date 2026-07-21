import { describe, it, expect } from 'vitest';
import {
  calcDryCookedTotals,
  calcDryCookedPer100g,
  calcDryCookedPerPortion,
  calcWeightChange,
  calcYieldRatio,
  calcCookedServingWeight,
  calcServingNutrition,
} from '../utils/calculations';

describe('calcDryCookedTotals', () => {
  it('calculates totals from dry weight with default 100g basis', () => {
    const result = calcDryCookedTotals({
      dryWeight: 300,
      dryCaloriesPer100g: 360,
      dryProteinPer100g: 7,
      dryCarbsPer100g: 80,
      dryFatPer100g: 1,
      nutritionBasis: 100,
      cookedWeight: 750,
      portions: 4,
    });
    expect(result.totalCalories).toBe(1080);
    expect(result.totalProtein).toBe(21);
    expect(result.totalCarbs).toBe(240);
    expect(result.totalFat).toBe(3);
  });

  it('calculates totals with custom basis (e.g. per 70g)', () => {
    const result = calcDryCookedTotals({
      dryWeight: 210,
      dryCaloriesPer100g: 245,
      dryProteinPer100g: 7,
      dryCarbsPer100g: 56,
      dryFatPer100g: 0.7,
      nutritionBasis: 70,
      cookedWeight: 500,
      portions: 4,
    });
    expect(result.totalCalories).toBe(735);
    expect(result.totalProtein).toBe(21);
    expect(result.totalCarbs).toBe(168);
    expect(result.totalFat).toBeCloseTo(2.1, 5);
  });
});

describe('calcDryCookedPer100g', () => {
  it('calculates per-100g values for weight gain (rice)', () => {
    const result = calcDryCookedPer100g(
      { totalCalories: 1080, totalProtein: 21, totalCarbs: 240, totalFat: 3 },
      750,
    );
    expect(result.caloriesPer100gCooked).toBe(144);
    expect(result.proteinPer100gCooked).toBeCloseTo(2.8, 5);
    expect(result.carbsPer100gCooked).toBeCloseTo(32, 5);
    expect(result.fatPer100gCooked).toBeCloseTo(0.4, 5);
  });
});

describe('calcDryCookedPerPortion', () => {
  it('calculates per-portion values', () => {
    const result = calcDryCookedPerPortion(
      { totalCalories: 1080, totalProtein: 21, totalCarbs: 240, totalFat: 3 },
      750,
      4,
    );
    expect(result.gramsPerPortion).toBe(187.5);
    expect(result.caloriesPerPortion).toBe(270);
    expect(result.proteinPerPortion).toBe(5.25);
    expect(result.carbsPerPortion).toBe(60);
    expect(result.fatPerPortion).toBe(0.75);
  });
});

describe('calcWeightChange', () => {
  it('calculates weight gain', () => {
    const result = calcWeightChange(300, 750);
    expect(result.grams).toBe(450);
    expect(result.percentage).toBe(150);
    expect(result.gained).toBe(true);
  });

  it('calculates weight loss', () => {
    const result = calcWeightChange(500, 350);
    expect(result.grams).toBe(-150);
    expect(result.percentage).toBe(-30);
    expect(result.gained).toBe(false);
  });
});

describe('calcYieldRatio', () => {
  it('calculates yield ratio', () => {
    expect(calcYieldRatio(300, 750)).toBe(2.5);
    expect(calcYieldRatio(500, 350)).toBe(0.7);
  });

  it('returns 0 for zero dry weight', () => {
    expect(calcYieldRatio(0, 750)).toBe(0);
  });
});

describe('calcCookedServingWeight', () => {
  it('converts dry serving to cooked', () => {
    expect(calcCookedServingWeight(75, 300, 750)).toBe(187.5);
  });

  it('returns 0 for invalid inputs', () => {
    expect(calcCookedServingWeight(0, 300, 750)).toBe(0);
    expect(calcCookedServingWeight(75, 0, 750)).toBe(0);
  });
});

describe('calcServingNutrition', () => {
  it('calculates nutrition for a dry serving', () => {
    const totals = { totalCalories: 1080, totalProtein: 21, totalCarbs: 240, totalFat: 3 };
    const result = calcServingNutrition(totals, 75, 300);
    expect(result!.totalCalories).toBe(270);
    expect(result!.totalProtein).toBe(5.25);
    expect(result!.totalCarbs).toBe(60);
    expect(result!.totalFat).toBe(0.75);
  });

  it('returns null for invalid inputs', () => {
    const totals = { totalCalories: 1080, totalProtein: 21, totalCarbs: 240, totalFat: 3 };
    expect(calcServingNutrition(totals, 0, 300)).toBeNull();
    expect(calcServingNutrition(totals, 75, 0)).toBeNull();
  });
});
