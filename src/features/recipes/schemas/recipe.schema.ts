import { z } from 'zod';

const ingredientInputSchema = z.preprocess((value) => {
  if (!value || typeof value !== 'object') return value;
  const ingredient = value as Record<string, unknown>;
  if ('weight' in ingredient) return value;
  if (typeof ingredient.quantityGrams === 'number') {
    return {
      ...ingredient,
      weight: ingredient.quantityGrams,
      unit: 'g',
      unitConversionId: null,
    };
  }
  return value;
}, z.object({
  id: z.string(),
  name: z.string(),
  weight: z.number().min(0),
  unit: z.string().default('g'),
  unitConversionId: z.string().nullable().default(null),
  caloriesPer100g: z.number().min(0),
  proteinPer100g: z.number().min(0),
  carbsPer100g: z.number().min(0).default(0),
  fatPer100g: z.number().min(0).default(0),
}));

export const ingredientSchema = ingredientInputSchema;

export const recipeSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  portions: z.number().int().min(1),
  ingredients: z.array(ingredientSchema),
  createdAt: z.number(),
  updatedAt: z.number().default(0),
  tags: z.array(z.string()).default([]),
  favourite: z.boolean().default(false),
  notes: z.string().default(''),
});

export const recipesArraySchema = z.array(recipeSchema);

export type Ingredient = z.infer<typeof ingredientSchema>;
export type Recipe = z.infer<typeof recipeSchema>;
