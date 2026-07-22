import type { MealPlanEntry } from '../schemas/meal-plan.schema';
import type { Recipe } from '@/features/recipes/schemas/recipe.schema';
import type { PerPortion } from '@/features/recipes/utils/calculations';
import { getRecipePerPortion } from '@/features/recipes/utils/recipe-nutrition';

export interface DayNutrition {
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  isComplete: boolean;
  missingCount: number;
}

export interface WeekNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  isComplete: boolean;
  missingCount: number;
}

function getPerServing(recipe: Recipe, unitConversions?: Map<string, number>): PerPortion | null {
  return getRecipePerPortion(recipe, unitConversions);
}

export function calculateDayNutrition(
  entries: MealPlanEntry[],
  recipeMap: Map<string, Recipe>,
  unitConversions?: Map<string, number>,
): DayNutrition {
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let missingCount = 0;

  for (const entry of entries) {
    const recipe = recipeMap.get(entry.recipeId);
    if (!recipe) { missingCount++; continue; }
    const per = getPerServing(recipe, unitConversions);
    if (!per) { missingCount++; continue; }
    calories += per.caloriesPerPortion * entry.servings;
    protein += per.proteinPerPortion * entry.servings;
    carbs += per.carbsPerPortion * entry.servings;
    fat += per.fatPerPortion * entry.servings;
  }

  return {
    date: entries[0]?.plannedDate ?? '',
    calories,
    protein,
    carbs,
    fat,
    isComplete: missingCount === 0,
    missingCount,
  };
}

export function calculateWeekNutrition(
  entries: MealPlanEntry[],
  recipeMap: Map<string, Recipe>,
  unitConversions?: Map<string, number>,
): WeekNutrition {
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let missingCount = 0;

  for (const entry of entries) {
    const recipe = recipeMap.get(entry.recipeId);
    if (!recipe) { missingCount++; continue; }
    const per = getPerServing(recipe, unitConversions);
    if (!per) { missingCount++; continue; }
    calories += per.caloriesPerPortion * entry.servings;
    protein += per.proteinPerPortion * entry.servings;
    carbs += per.carbsPerPortion * entry.servings;
    fat += per.fatPerPortion * entry.servings;
  }

  return {
    calories,
    protein,
    carbs,
    fat,
    isComplete: missingCount === 0,
    missingCount,
  };
}

export function calculateDayAverages(week: WeekNutrition, daysWithMeals: number): WeekNutrition | null {
  if (daysWithMeals <= 0) return null;
  return {
    calories: week.calories / daysWithMeals,
    protein: week.protein / daysWithMeals,
    carbs: week.carbs / daysWithMeals,
    fat: week.fat / daysWithMeals,
    isComplete: week.isComplete,
    missingCount: week.missingCount,
  };
}
