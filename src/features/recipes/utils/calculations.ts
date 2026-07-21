import { round1dp } from '@/shared/utils/format';
import { convertWeightToGrams, convertIngredientUnitToGrams } from '@/shared/units/conversion';
import type { WeightUnit, UnitId } from '@/shared/units/types';

export function calcIngredientCalories(weightInGrams: number, caloriesPer100g: number): number {
  return (weightInGrams / 100) * caloriesPer100g;
}

export function calcIngredientProtein(weightInGrams: number, proteinPer100g: number): number {
  return (weightInGrams / 100) * proteinPer100g;
}

export function calcIngredientCarbs(weightInGrams: number, carbsPer100g: number): number {
  return (weightInGrams / 100) * carbsPer100g;
}

export function calcIngredientFat(weightInGrams: number, fatPer100g: number): number {
  return (weightInGrams / 100) * fatPer100g;
}

export interface IngredientTotals {
  totalWeight: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  isComplete: boolean;
  incompleteCount: number;
}

export interface PerPortion {
  weightPerPortion: number;
  caloriesPerPortion: number;
  proteinPerPortion: number;
  carbsPerPortion: number;
  fatPerPortion: number;
}

interface CalcIngredient {
  weight: number;
  unit?: string;
  unitConversionId?: string | null;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

function resolveGrams(ing: CalcIngredient, unitConversions?: Map<string, number>): { grams: number; available: boolean } {
  const unit = (ing.unit || 'g') as UnitId;

  if (unit === 'g') return { grams: ing.weight, available: true };

  const result = convertWeightToGrams(ing.weight, unit as WeightUnit);
  if (result.status === 'available') {
    return { grams: result.grams!, available: true };
  }

  const gramsPerUnit = ing.unitConversionId ? unitConversions?.get(ing.unitConversionId) : undefined;
  const ingResult = convertIngredientUnitToGrams(ing.weight, gramsPerUnit);
  if (ingResult.status === 'available') {
    return { grams: ingResult.grams!, available: true };
  }

  return { grams: 0, available: false };
}

export function calcBatchTotals(
  ingredients: CalcIngredient[],
  unitConversions?: Map<string, number>,
): IngredientTotals {
  let totalWeight = 0;
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let incompleteCount = 0;

  for (const ing of ingredients) {
    const { grams, available } = resolveGrams(ing, unitConversions);
    if (!available) {
      incompleteCount++;
      continue;
    }
    totalWeight += grams;
    totalCalories += calcIngredientCalories(grams, ing.caloriesPer100g);
    totalProtein += calcIngredientProtein(grams, ing.proteinPer100g);
    totalCarbs += calcIngredientCarbs(grams, ing.carbsPer100g);
    totalFat += calcIngredientFat(grams, ing.fatPer100g);
  }

  return {
    totalWeight,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFat,
    isComplete: incompleteCount === 0,
    incompleteCount,
  };
}

export function calcPerPortion(totals: IngredientTotals, portions: number): PerPortion {
  return {
    weightPerPortion: totals.totalWeight / portions,
    caloriesPerPortion: totals.totalCalories / portions,
    proteinPerPortion: totals.totalProtein / portions,
    carbsPerPortion: totals.totalCarbs / portions,
    fatPerPortion: totals.totalFat / portions,
  };
}

export { round1dp };
