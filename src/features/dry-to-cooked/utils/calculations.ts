import type { DryCookedInputs, DryCookedTotal, DryCookedPer100g, DryCookedPerPortion } from '../schemas/dry-cooked.schema';
import { round1dp } from '@/shared/utils/format';

export function calcDryCookedTotals(inputs: DryCookedInputs): DryCookedTotal {
  const basis = inputs.nutritionBasis || 100;
  return {
    totalCalories: (inputs.dryWeight / basis) * inputs.dryCaloriesPer100g,
    totalProtein: (inputs.dryWeight / basis) * inputs.dryProteinPer100g,
    totalCarbs: (inputs.dryWeight / basis) * inputs.dryCarbsPer100g,
    totalFat: (inputs.dryWeight / basis) * inputs.dryFatPer100g,
  };
}

export function calcDryCookedPer100g(totals: DryCookedTotal, cookedWeight: number): DryCookedPer100g {
  return {
    caloriesPer100gCooked: (totals.totalCalories / cookedWeight) * 100,
    proteinPer100gCooked: (totals.totalProtein / cookedWeight) * 100,
    carbsPer100gCooked: (totals.totalCarbs / cookedWeight) * 100,
    fatPer100gCooked: (totals.totalFat / cookedWeight) * 100,
  };
}

export function calcDryCookedPerPortion(
  totals: DryCookedTotal,
  cookedWeight: number,
  portions: number,
): DryCookedPerPortion {
  return {
    gramsPerPortion: cookedWeight / portions,
    caloriesPerPortion: totals.totalCalories / portions,
    proteinPerPortion: totals.totalProtein / portions,
    carbsPerPortion: totals.totalCarbs / portions,
    fatPerPortion: totals.totalFat / portions,
  };
}

export function calcWeightChange(dryWeight: number, cookedWeight: number): {
  grams: number;
  percentage: number;
  gained: boolean;
} {
  return {
    grams: cookedWeight - dryWeight,
    percentage: dryWeight > 0 ? ((cookedWeight - dryWeight) / dryWeight) * 100 : 0,
    gained: cookedWeight >= dryWeight,
  };
}

export function calcYieldRatio(dryWeight: number, cookedWeight: number): number {
  return dryWeight > 0 ? cookedWeight / dryWeight : 0;
}

export function calcCookedServingWeight(
  dryServingWeight: number,
  dryWeight: number,
  cookedWeight: number,
): number {
  if (dryWeight <= 0 || dryServingWeight <= 0) return 0;
  return (dryServingWeight * cookedWeight) / dryWeight;
}

export function calcServingNutrition(
  totals: DryCookedTotal,
  dryServingWeight: number,
  dryWeight: number,
): DryCookedTotal | null {
  if (dryWeight <= 0 || dryServingWeight <= 0) return null;
  const ratio = dryServingWeight / dryWeight;
  return {
    totalCalories: totals.totalCalories * ratio,
    totalProtein: totals.totalProtein * ratio,
    totalCarbs: totals.totalCarbs * ratio,
    totalFat: totals.totalFat * ratio,
  };
}

export { round1dp };
