import type { Recipe } from '../schemas/recipe.schema';
import type { UnitConversion } from '@/features/ingredients/conversions/unit-conversion.schema';
import { calcBatchTotals, calcPerPortion, type PerPortion, type IngredientTotals } from './calculations';

export function flattenUnitConversions(conversionsByIngredient: Map<string, UnitConversion[]>): Map<string, number> {
  const flat = new Map<string, number>();
  for (const conversions of conversionsByIngredient.values()) {
    for (const conversion of conversions) {
      flat.set(conversion.id, conversion.gramsPerUnit);
    }
  }
  return flat;
}

export function getRecipeTotals(recipe: Recipe, unitConversions?: Map<string, number>): IngredientTotals | null {
  const validIngredients = recipe.ingredients.filter((ingredient) => ingredient.weight > 0);
  if (validIngredients.length === 0) return null;
  return calcBatchTotals(validIngredients, unitConversions);
}

export function getRecipePerPortion(recipe: Recipe, unitConversions?: Map<string, number>): PerPortion | null {
  if (recipe.portions <= 0) return null;
  const totals = getRecipeTotals(recipe, unitConversions);
  if (!totals || !totals.isComplete) return null;
  return calcPerPortion(totals, recipe.portions);
}
