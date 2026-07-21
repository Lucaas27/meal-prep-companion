import { z } from 'zod';

export const savedCalculationSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  dryWeight: z.number().min(0),
  cookedWeight: z.number().min(0),
  dryCaloriesPer100g: z.number().min(0),
  dryProteinPer100g: z.number().min(0),
  dryCarbsPer100g: z.number().min(0).default(0),
  dryFatPer100g: z.number().min(0).default(0),
  nutritionBasis: z.number().min(1).default(100),
  portions: z.number().int().min(1).default(1),
  dryServingWeight: z.number().min(0).default(0),
  createdAt: z.number(),
  updatedAt: z.number().default(0),
});

export const savedCalculationsArraySchema = z.array(savedCalculationSchema);

export type SavedCalculation = z.infer<typeof savedCalculationSchema>;
