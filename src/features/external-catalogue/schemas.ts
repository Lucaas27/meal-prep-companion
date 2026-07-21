import { z } from 'zod';

export const externalServingOptionSchema = z.object({
  label: z.string(),
  unit: z.string(),
  gramsPerUnit: z.number().positive(),
  sourceDescription: z.string().nullable(),
});

export const externalSearchResultSchema = z.object({
  provider: z.string(),
  externalId: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  brand: z.string().nullable(),
  dataType: z.string().nullable(),
  caloriesPer100g: z.number().nullable(),
  proteinPer100g: z.number().nullable(),
  carbohydratesPer100g: z.number().nullable(),
  fatPer100g: z.number().nullable(),
});

export const externalFoodDetailsSchema = externalSearchResultSchema.extend({
  category: z.string().nullable(),
  servingOptions: z.array(externalServingOptionSchema),
  sourceUrl: z.string().nullable(),
  retrievedAt: z.string(),
});

export const externalFoodSearchPageSchema = z.object({
  items: z.array(externalSearchResultSchema),
  totalHits: z.number().int().min(0),
  currentPage: z.number().int().min(1),
  totalPages: z.number().int().min(0),
});
