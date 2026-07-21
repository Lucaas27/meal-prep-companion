import { round1dp } from '@/shared/utils/format';

export function calcIngredientCalories(weight: number, caloriesPer100g: number): number {
  return (weight / 100) * caloriesPer100g;
}

export function calcIngredientProtein(weight: number, proteinPer100g: number): number {
  return (weight / 100) * proteinPer100g;
}

export function calcIngredientCarbs(weight: number, carbsPer100g: number): number {
  return (weight / 100) * carbsPer100g;
}

export function calcIngredientFat(weight: number, fatPer100g: number): number {
  return (weight / 100) * fatPer100g;
}

export interface IngredientTotals {
  totalWeight: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface PerPortion {
  weightPerPortion: number;
  caloriesPerPortion: number;
  proteinPerPortion: number;
  carbsPerPortion: number;
  fatPerPortion: number;
}

export function calcBatchTotals(
  ingredients: { weight: number; caloriesPer100g: number; proteinPer100g: number; carbsPer100g: number; fatPer100g: number }[],
): IngredientTotals {
  let totalWeight = 0;
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;

  for (const ing of ingredients) {
    totalWeight += ing.weight;
    totalCalories += calcIngredientCalories(ing.weight, ing.caloriesPer100g);
    totalProtein += calcIngredientProtein(ing.weight, ing.proteinPer100g);
    totalCarbs += calcIngredientCarbs(ing.weight, ing.carbsPer100g);
    totalFat += calcIngredientFat(ing.weight, ing.fatPer100g);
  }

  return { totalWeight, totalCalories, totalProtein, totalCarbs, totalFat };
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
