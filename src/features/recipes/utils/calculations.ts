import { round1dp } from '@/shared/utils/format';

export function calcIngredientCalories(weight: number, caloriesPer100g: number): number {
  return (weight / 100) * caloriesPer100g;
}

export function calcIngredientProtein(weight: number, proteinPer100g: number): number {
  return (weight / 100) * proteinPer100g;
}

export interface IngredientTotals {
  totalWeight: number;
  totalCalories: number;
  totalProtein: number;
}

export interface PerPortion {
  weightPerPortion: number;
  caloriesPerPortion: number;
  proteinPerPortion: number;
}

export function calcBatchTotals(
  ingredients: { weight: number; caloriesPer100g: number; proteinPer100g: number }[],
): IngredientTotals {
  let totalWeight = 0;
  let totalCalories = 0;
  let totalProtein = 0;

  for (const ing of ingredients) {
    totalWeight += ing.weight;
    totalCalories += calcIngredientCalories(ing.weight, ing.caloriesPer100g);
    totalProtein += calcIngredientProtein(ing.weight, ing.proteinPer100g);
  }

  return { totalWeight, totalCalories, totalProtein };
}

export function calcPerPortion(totals: IngredientTotals, portions: number): PerPortion {
  return {
    weightPerPortion: totals.totalWeight / portions,
    caloriesPerPortion: totals.totalCalories / portions,
    proteinPerPortion: totals.totalProtein / portions,
  };
}

export { round1dp };
