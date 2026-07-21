import type { DryCookedInputs, DryCookedTotal, DryCookedPer100g, DryCookedPerPortion } from '../schemas/dry-cooked.schema';
import { round1dp } from '@/shared/utils/format';

export function calcDryCookedTotals(inputs: DryCookedInputs): DryCookedTotal {
  return {
    totalCalories: (inputs.dryWeight / 100) * inputs.dryCaloriesPer100g,
    totalProtein: (inputs.dryWeight / 100) * inputs.dryProteinPer100g,
  };
}

export function calcDryCookedPer100g(totals: DryCookedTotal, cookedWeight: number): DryCookedPer100g {
  return {
    caloriesPer100gCooked: (totals.totalCalories / cookedWeight) * 100,
    proteinPer100gCooked: (totals.totalProtein / cookedWeight) * 100,
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
  };
}

export { round1dp };
