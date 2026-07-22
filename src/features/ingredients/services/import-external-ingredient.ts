import { z } from 'zod';
import { getSupabaseClient, getSupabaseClientOrNull } from '@/infrastructure/supabase/client';
import { storedIngredientSchema } from '../schemas/ingredient.schema';
import { unitConversionSchema } from '../conversions/unit-conversion.schema';
import { mapIngredientRow } from '../repositories/ingredient-mapper';
import { mapConversionRow } from '../conversions/unit-conversion-mapper';
import { ingredientRepository } from '../repositories/ingredient.repository';

const importedProviderSchema = z.enum(['usda', 'open-food-facts']);

const importConversionInputSchema = unitConversionSchema.pick({
  unit: true,
  label: true,
  gramsPerUnit: true,
  isDefault: true,
  sourceType: true,
  externalSourceId: true,
});

export type ImportExternalIngredientConversionInput = z.infer<typeof importConversionInputSchema>;

export const importExternalIngredientInputSchema = z.object({
  name: storedIngredientSchema.shape.name,
  caloriesPer100g: storedIngredientSchema.shape.caloriesPer100g,
  proteinPer100g: storedIngredientSchema.shape.proteinPer100g,
  carbsPer100g: storedIngredientSchema.shape.carbsPer100g,
  fatPer100g: storedIngredientSchema.shape.fatPer100g,
  category: storedIngredientSchema.shape.category,
  provider: importedProviderSchema,
  externalId: z.string().trim().min(1),
  externalSourceName: z.string().trim().min(1),
  approvedConversions: z.array(importConversionInputSchema).default([]),
});

export type ImportExternalIngredientInput = z.infer<typeof importExternalIngredientInputSchema>;

const ingredientRowSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string(),
  normalized_name: z.string(),
  calories_per_100g: z.number(),
  protein_per_100g: z.number(),
  carbs_per_100g: z.number(),
  fat_per_100g: z.number(),
  category: z.string().nullable(),
  source: z.string().nullable(),
  external_source_id: z.string().nullable(),
  external_source_name: z.string().nullable(),
  imported_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

const conversionRowSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  ingredient_id: z.string(),
  unit: z.string(),
  label: z.string(),
  grams_per_unit: z.number(),
  is_default: z.boolean(),
  source_type: z.string(),
  external_source_id: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

const rpcCreatedSchema = z.object({
  status: z.literal('created'),
  ingredient: ingredientRowSchema,
  conversions: z.array(conversionRowSchema),
});

const rpcDuplicateSchema = z.object({
  status: z.literal('duplicate'),
  ingredient: ingredientRowSchema,
  conversions: z.array(conversionRowSchema),
});

const rpcErrorSchema = z.object({
  status: z.enum(['validation_error', 'storage_error']),
  message: z.string(),
});

const rpcResponseSchema = z.union([rpcCreatedSchema, rpcDuplicateSchema, rpcErrorSchema]);

export type ImportExternalIngredientResult =
  | { status: 'created'; ingredient: z.infer<typeof storedIngredientSchema>; conversions: z.infer<typeof unitConversionSchema>[] }
  | { status: 'duplicate'; existingIngredient: z.infer<typeof storedIngredientSchema>; conversions: z.infer<typeof unitConversionSchema>[] };

export class ImportExternalIngredientError extends Error {
  public readonly code: 'unauthenticated' | 'validation' | 'storage';
  public override readonly cause?: unknown;

  constructor(
    code: 'unauthenticated' | 'validation' | 'storage',
    message: string,
    cause?: unknown,
  ) {
    super(message);
    this.code = code;
    this.cause = cause;
  }
}

export async function findImportedIngredient(provider: string, externalId: string) {
  if (!provider || !externalId) return null;

  const supabase = getSupabaseClientOrNull();
  if (!supabase) {
    return ingredientRepository.getAll().find((ingredient) => ingredient.source === provider && ingredient.externalSourceId === externalId) ?? null;
  }

  const { data, error } = await supabase
    .from('ingredients')
    .select('*')
    .eq('source', provider)
    .eq('external_source_id', externalId)
    .maybeSingle();

  if (error || !data) return null;

  const parsed = storedIngredientSchema.safeParse(mapIngredientRow(data));
  return parsed.success ? parsed.data : null;
}

export async function importExternalIngredient(input: ImportExternalIngredientInput): Promise<ImportExternalIngredientResult> {
  const parsedInput = importExternalIngredientInputSchema.safeParse(input);
  if (!parsedInput.success) {
    throw new ImportExternalIngredientError('validation', parsedInput.error.issues[0]?.message || 'Invalid import payload', parsedInput.error);
  }

  const supabase = getSupabaseClient();
  const payload = parsedInput.data;
  const rpc = (supabase as unknown as {
    rpc: (fn: string, args: { p_payload: unknown }) => PromiseLike<{ data: unknown; error: { message?: string } | null }>;
  }).rpc;

  const { data, error } = await rpc('import_external_ingredient_atomic', {
    p_payload: {
      name: payload.name,
      caloriesPer100g: payload.caloriesPer100g,
      proteinPer100g: payload.proteinPer100g,
      carbsPer100g: payload.carbsPer100g,
      fatPer100g: payload.fatPer100g,
      category: payload.category,
      provider: payload.provider,
      externalId: payload.externalId,
      externalSourceName: payload.externalSourceName,
      approvedConversions: payload.approvedConversions,
    },
  });

  if (error) {
    if (error.message?.toLowerCase().includes('not authenticated') || error.message?.toLowerCase().includes('permission denied')) {
      throw new ImportExternalIngredientError('unauthenticated', 'You must be signed in to import foods.', error);
    }
    throw new ImportExternalIngredientError('storage', error.message || 'Failed to import ingredient.', error);
  }

  const parsedResponse = rpcResponseSchema.safeParse(data);
  if (!parsedResponse.success) {
    throw new ImportExternalIngredientError('storage', 'Invalid import response.', parsedResponse.error);
  }

  const result = parsedResponse.data;

  if (result.status === 'validation_error') {
    throw new ImportExternalIngredientError('validation', result.message, result);
  }

  if (result.status === 'storage_error') {
    throw new ImportExternalIngredientError('storage', result.message, result);
  }

  if (result.status === 'duplicate') {
    const ingredient = storedIngredientSchema.parse(mapIngredientRow(result.ingredient));
    const conversions = result.conversions.map((row: z.infer<typeof conversionRowSchema>) => unitConversionSchema.parse(mapConversionRow(row)));
    return { status: 'duplicate', existingIngredient: ingredient, conversions };
  }

  if (result.status !== 'created') {
    throw new ImportExternalIngredientError('storage', 'Invalid import response.', result);
  }

  const ingredient = storedIngredientSchema.parse(mapIngredientRow(result.ingredient));
  const conversions = result.conversions.map((row: z.infer<typeof conversionRowSchema>) => unitConversionSchema.parse(mapConversionRow(row)));
  return { status: 'created', ingredient, conversions };
}
