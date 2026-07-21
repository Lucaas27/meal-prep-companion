import { z } from 'zod';

export const storedIngredientSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  caloriesPer100g: z.number().min(0),
  proteinPer100g: z.number().min(0),
  carbsPer100g: z.number().min(0).default(0),
  fatPer100g: z.number().min(0).default(0),
  category: z.string().default(''),
  source: z.enum(['starter', 'custom', 'usda', 'open-food-facts']).default('custom'),
  externalSourceId: z.string().nullable().default(null),
  externalSourceName: z.string().nullable().default(null),
  importedAt: z.number().nullable().default(null),
  createdAt: z.number().default(() => Date.now()),
  updatedAt: z.number().default(0),
});

export const storedIngredientsArraySchema = z.array(storedIngredientSchema);

export type StoredIngredient = z.infer<typeof storedIngredientSchema>;

export const SOURCE_LABELS: Record<StoredIngredient['source'], string> = {
  starter: 'starter',
  custom: 'custom',
  usda: 'USDA',
  'open-food-facts': 'Open Food Facts',
};
