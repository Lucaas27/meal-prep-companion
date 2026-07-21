import { z } from 'zod';
import { INGREDIENT_UNITS } from '@/shared/units/types';

export const SOURCE_TYPES = ['manual', 'usda', 'open-food-facts'] as const;

export const unitConversionSchema = z.object({
  id: z.string(),
  ingredientId: z.string(),
  unit: z.enum(INGREDIENT_UNITS),
  label: z.string().min(1),
  gramsPerUnit: z.number().positive(),
  isDefault: z.boolean().default(false),
  sourceType: z.enum(SOURCE_TYPES).default('manual'),
  externalSourceId: z.string().nullable().default(null),
  createdAt: z.number(),
  updatedAt: z.number().default(0),
});

export type UnitConversion = z.infer<typeof unitConversionSchema>;
