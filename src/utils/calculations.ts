import type {
  IngredientTotals,
  PerPortion,
  RiceInputs,
  RicePer100g,
  RicePerPortion,
  RiceTotal,
} from '../types';

export function calcIngredientCalories(
  weight: number,
  caloriesPer100g: number,
): number {
  return (weight / 100) * caloriesPer100g;
}

export function calcIngredientProtein(
  weight: number,
  proteinPer100g: number,
): number {
  return (weight / 100) * proteinPer100g;
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

export function calcPerPortion(
  totals: IngredientTotals,
  portions: number,
): PerPortion {
  return {
    weightPerPortion: totals.totalWeight / portions,
    caloriesPerPortion: totals.totalCalories / portions,
    proteinPerPortion: totals.totalProtein / portions,
  };
}

export function calcRiceTotals(inputs: RiceInputs): RiceTotal {
  return {
    totalCalories: (inputs.dryWeight / 100) * inputs.dryCaloriesPer100g,
    totalProtein: (inputs.dryWeight / 100) * inputs.dryProteinPer100g,
  };
}

export function calcRicePer100g(
  totals: RiceTotal,
  cookedWeight: number,
): RicePer100g {
  return {
    caloriesPer100gCooked: (totals.totalCalories / cookedWeight) * 100,
    proteinPer100gCooked: (totals.totalProtein / cookedWeight) * 100,
  };
}

export function calcRicePerPortion(
  totals: RiceTotal,
  cookedWeight: number,
  portions: number,
): RicePerPortion {
  return {
    gramsPerPortion: cookedWeight / portions,
    caloriesPerPortion: totals.totalCalories / portions,
    proteinPerPortion: totals.totalProtein / portions,
  };
}

export function round1dp(n: number): number {
  return Math.round(n * 10) / 10;
}
