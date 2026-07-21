import { z } from 'zod';

export const ingredientSchema = z.object({
  id: z.string(),
  name: z.string(),
  weight: z.number().min(0),
  caloriesPer100g: z.number().min(0),
  proteinPer100g: z.number().min(0),
});

export const recipeSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  portions: z.number().int().min(1),
  ingredients: z.array(ingredientSchema),
  createdAt: z.number(),
});

export const recipesArraySchema = z.array(recipeSchema);

export type Ingredient = z.infer<typeof ingredientSchema>;
export type Recipe = z.infer<typeof recipeSchema>;
