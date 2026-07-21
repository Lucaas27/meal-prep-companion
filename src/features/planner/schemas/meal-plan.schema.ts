import { z } from 'zod';

export const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export const mealPlanEntrySchema = z.object({
  id: z.string(),
  recipeId: z.string(),
  plannedDate: z.string(),
  mealSlot: z.enum(MEAL_SLOTS),
  servings: z.number().int().min(1),
  notes: z.string().default(''),
  position: z.number().int().min(0),
  createdAt: z.number(),
  updatedAt: z.number().default(0),
});

export type MealPlanEntry = z.infer<typeof mealPlanEntrySchema>;
