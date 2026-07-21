import { z } from 'zod';

export const dryCookedInputsSchema = z.object({
  dryWeight: z.number().min(0),
  dryCaloriesPer100g: z.number().min(0),
  dryProteinPer100g: z.number().min(0),
  dryCarbsPer100g: z.number().min(0).default(0),
  dryFatPer100g: z.number().min(0).default(0),
  cookedWeight: z.number().min(0),
  portions: z.number().int().min(1),
});

export type DryCookedInputs = z.infer<typeof dryCookedInputsSchema>;

export interface DryCookedTotal {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface DryCookedPer100g {
  caloriesPer100gCooked: number;
  proteinPer100gCooked: number;
  carbsPer100gCooked: number;
  fatPer100gCooked: number;
}

export interface DryCookedPerPortion {
  gramsPerPortion: number;
  caloriesPerPortion: number;
  proteinPerPortion: number;
  carbsPerPortion: number;
  fatPerPortion: number;
}
