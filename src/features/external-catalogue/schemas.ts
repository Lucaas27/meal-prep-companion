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

export const barcodeCompletenessStatusSchema = z.enum([
  'complete',
  'partial',
  'missing_name',
  'missing_nutrition',
]);

export const externalBarcodeFoodDetailsSchema = externalFoodDetailsSchema.extend({
  provider: z.literal('open-food-facts'),
  barcode: z.string(),
  imageUrl: z.string().nullable(),
  packageQuantityText: z.string().nullable(),
  servingSizeText: z.string().nullable(),
  servingQuantityGrams: z.number().positive().nullable(),
  fibrePer100g: z.number().min(0).nullable(),
  saltPer100g: z.number().min(0).nullable(),
  sodiumPer100g: z.number().min(0).nullable(),
  completenessStatus: barcodeCompletenessStatusSchema,
});

export const externalFoodSearchPageSchema = z.object({
  items: z.array(externalSearchResultSchema),
  totalHits: z.number().int().min(0),
  currentPage: z.number().int().min(1),
  totalPages: z.number().int().min(0),
});
