import { z } from 'zod';

export const storedIngredientSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  caloriesPer100g: z.number().min(0),
  proteinPer100g: z.number().min(0),
  carbsPer100g: z.number().min(0).default(0),
  fatPer100g: z.number().min(0).default(0),
  category: z.string().default(''),
  source: z.enum(['starter', 'custom']).default('custom'),
  createdAt: z.number().default(() => Date.now()),
  updatedAt: z.number().default(0),
});

export const storedIngredientsArraySchema = z.array(storedIngredientSchema);

export type StoredIngredient = z.infer<typeof storedIngredientSchema>;
