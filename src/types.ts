export interface Ingredient {
  id: string;
  name: string;
  weight: number;
  caloriesPer100g: number;
  proteinPer100g: number;
}

export interface Recipe {
  id: string;
  name: string;
  portions: number;
  ingredients: Ingredient[];
  createdAt: number;
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

export interface RiceInputs {
  dryWeight: number;
  dryCaloriesPer100g: number;
  dryProteinPer100g: number;
  cookedWeight: number;
  portions: number;
}

export interface RiceTotal {
  totalCalories: number;
  totalProtein: number;
}

export interface RicePer100g {
  caloriesPer100gCooked: number;
  proteinPer100gCooked: number;
}

export interface RicePerPortion {
  gramsPerPortion: number;
  caloriesPerPortion: number;
  proteinPerPortion: number;
}

export type Tab = 'batch' | 'rice' | 'saved';
