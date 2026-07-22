import { z } from 'zod';
import { recipeRepository } from '@/features/recipes/repositories/recipe.repository';
import { ingredientRepository } from '@/features/ingredients/repositories/ingredient.repository';
import { dryToCookedRepository } from '@/features/dry-to-cooked/repositories/dry-to-cooked.repository';
import { mealPlanRepository } from '@/features/planner/repositories/meal-plan.repository';
import { supabaseRecipeRepository } from '@/features/recipes/repositories/supabase-recipe.repository';
import { supabaseIngredientRepository } from '@/features/ingredients/repositories/supabase-ingredient.repository';
import { supabaseCalcRepository } from '@/features/dry-to-cooked/repositories/supabase-calc.repository';
import { unitConversionRepository } from '@/features/ingredients/conversions/unit-conversion.repository';
import { recipeSchema, type Recipe } from '@/features/recipes/schemas/recipe.schema';
import { storedIngredientSchema, type StoredIngredient } from '@/features/ingredients/schemas/ingredient.schema';
import { savedCalculationSchema, type SavedCalculation } from '@/features/dry-to-cooked/schemas/saved-calculation.schema';
import { mealPlanEntrySchema, type MealPlanEntry } from '@/features/planner/schemas/meal-plan.schema';
import { unitConversionSchema, type UnitConversion } from '@/features/ingredients/conversions/unit-conversion.schema';
import { getSupabaseClientOrNull } from '@/infrastructure/supabase/client';
import { makeId } from '@/shared/lib/ids';

const BACKUP_FORMAT_VERSION = 2;

const backupDataSchema = z.object({
  ingredients: z.array(storedIngredientSchema),
  ingredientUnitConversions: z.array(unitConversionSchema),
  recipes: z.array(recipeSchema),
  dryToCookedCalculations: z.array(savedCalculationSchema),
  mealPlanEntries: z.array(mealPlanEntrySchema),
});

const backupEnvelopeSchema = z.object({
  application: z.literal('meal-prep-companion'),
  exportedAt: z.string(),
  formatVersion: z.number().int().min(1),
  data: z.object({
    ingredients: z.array(z.unknown()).default([]),
    ingredientUnitConversions: z.array(z.unknown()).default([]),
    recipes: z.array(z.unknown()).default([]),
    dryToCookedCalculations: z.array(z.unknown()).default([]),
    mealPlanEntries: z.array(z.unknown()).default([]),
  }),
});

export type BackupFile = z.infer<typeof backupEnvelopeSchema> & { formatVersion: 2; data: z.infer<typeof backupDataSchema> };

export interface RestoreBackupResult {
  ingredients: number;
  ingredientUnitConversions: number;
  recipes: number;
  dryToCookedCalculations: number;
  mealPlanEntries: number;
  warnings: string[];
}

export class RestoreBackupError extends Error {
  constructor(message: string) {
    super(message);
  }
}

function translateLegacyRecipe(recipe: unknown) {
  if (!recipe || typeof recipe !== 'object') return recipe;
  const record = recipe as Record<string, unknown>;
  if (!Array.isArray(record.ingredients)) return recipe;

  return {
    ...record,
    ingredients: record.ingredients.map((ingredient) => {
      if (!ingredient || typeof ingredient !== 'object') return ingredient;
      const item = ingredient as Record<string, unknown>;
      if ('weight' in item) return item;
      if (typeof item.quantityGrams !== 'number') return item;
      return {
        ...item,
        weight: item.quantityGrams,
        unit: 'g',
        unitConversionId: null,
      };
    }),
  };
}

async function loadIngredients() {
  return getSupabaseClientOrNull() ? supabaseIngredientRepository.getAll() : ingredientRepository.getAll();
}

async function loadRecipes() {
  return getSupabaseClientOrNull() ? supabaseRecipeRepository.getAll() : recipeRepository.getAll();
}

async function loadCalculations() {
  return getSupabaseClientOrNull() ? supabaseCalcRepository.getAll() : dryToCookedRepository.getAll();
}

async function loadConversions(ingredients: StoredIngredient[]) {
  if (!getSupabaseClientOrNull()) return [];
  const conversions = await Promise.all(ingredients.map((ingredient) => unitConversionRepository.listForIngredient(ingredient.id)));
  return conversions.flat();
}

async function loadMealPlanEntries() {
  if (!getSupabaseClientOrNull()) return [];
  return mealPlanRepository.getAll();
}

export async function createBackupData(): Promise<BackupFile> {
  const ingredients = await loadIngredients();
  const [recipes, dryToCookedCalculations, ingredientUnitConversions, mealPlanEntries] = await Promise.all([
    loadRecipes(),
    loadCalculations(),
    loadConversions(ingredients),
    loadMealPlanEntries(),
  ]);

  return {
    application: 'meal-prep-companion',
    exportedAt: new Date().toISOString(),
    formatVersion: BACKUP_FORMAT_VERSION,
    data: backupDataSchema.parse({
      ingredients,
      ingredientUnitConversions,
      recipes,
      dryToCookedCalculations,
      mealPlanEntries,
    }),
  };
}

function parseBackup(raw: unknown) {
  const parsed = backupEnvelopeSchema.safeParse(raw);
  if (!parsed.success) {
    throw new RestoreBackupError(parsed.error.issues[0]?.message || 'Invalid backup file.');
  }

  return {
    application: parsed.data.application,
    exportedAt: parsed.data.exportedAt,
    formatVersion: parsed.data.formatVersion,
    data: backupDataSchema.parse({
      ingredients: parsed.data.data.ingredients,
      ingredientUnitConversions: parsed.data.data.ingredientUnitConversions,
      recipes: parsed.data.data.recipes.map(translateLegacyRecipe),
      dryToCookedCalculations: parsed.data.data.dryToCookedCalculations,
      mealPlanEntries: parsed.data.data.mealPlanEntries,
    }),
  };
}

function provenanceKey(ingredient: StoredIngredient) {
  return ingredient.source === 'usda' || ingredient.source === 'open-food-facts'
    ? `${ingredient.source}:${ingredient.externalSourceId ?? ''}`
    : null;
}

function conversionLabelKey(conversion: UnitConversion) {
  return `${conversion.ingredientId}:${conversion.label.trim().toLowerCase()}`;
}

export async function restoreBackupData(raw: unknown): Promise<RestoreBackupResult> {
  const backup = parseBackup(raw);
  const supabase = getSupabaseClientOrNull();

  if (!supabase && (backup.data.ingredientUnitConversions.length > 0 || backup.data.mealPlanEntries.length > 0)) {
    throw new RestoreBackupError('This backup includes unit conversions or planner data and requires Supabase to restore.');
  }

  const [existingIngredients, existingRecipes, existingCalculations, existingMealPlanEntries] = await Promise.all([
    loadIngredients(),
    loadRecipes(),
    loadCalculations(),
    loadMealPlanEntries(),
  ]);

  const warnings: string[] = [];
  const ingredientIdMap = new Map<string, string>();
  const ingredientsToSave: StoredIngredient[] = [];
  const existingIngredientIds = new Set(existingIngredients.map((ingredient) => ingredient.id));
  const reservedIngredientIds = new Set(existingIngredientIds);
  const provenanceMap = new Map(existingIngredients.map((ingredient) => {
    const key = provenanceKey(ingredient);
    return key ? [key, ingredient] : null;
  }).filter((entry): entry is [string, StoredIngredient] => !!entry));

  for (const ingredient of backup.data.ingredients) {
    const key = provenanceKey(ingredient);
    if (key && provenanceMap.has(key)) {
      const existing = provenanceMap.get(key)!;
      ingredientIdMap.set(ingredient.id, existing.id);
      warnings.push(`Reused existing imported ingredient for ${key}.`);
      continue;
    }

    let nextId = ingredient.id;
    if (reservedIngredientIds.has(nextId)) {
      nextId = makeId();
    }

    reservedIngredientIds.add(nextId);
    ingredientIdMap.set(ingredient.id, nextId);
    const saved = { ...ingredient, id: nextId };
    ingredientsToSave.push(saved);
    if (key) provenanceMap.set(key, saved);
  }

  const existingConversionsById = new Map<string, UnitConversion>();
  const existingConversionsByLabel = new Map<string, UnitConversion>();
  if (supabase) {
    for (const ingredient of existingIngredients) {
      const conversions = await unitConversionRepository.listForIngredient(ingredient.id);
      for (const conversion of conversions) {
        existingConversionsById.set(conversion.id, conversion);
        existingConversionsByLabel.set(conversionLabelKey(conversion), conversion);
      }
    }
  }

  const conversionIdMap = new Map<string, { id: string; ingredientId: string }>();
  const conversionsToSave: UnitConversion[] = [];
  const reservedConversionIds = new Set(existingConversionsById.keys());

  for (const conversion of backup.data.ingredientUnitConversions) {
    const ingredientId = ingredientIdMap.get(conversion.ingredientId) ?? conversion.ingredientId;
    if (!ingredientIdMap.has(conversion.ingredientId) && !existingIngredients.some((ingredient) => ingredient.id === ingredientId)) {
      throw new RestoreBackupError(`Conversion "${conversion.label}" references a missing ingredient.`);
    }

    const labelKey = conversionLabelKey({ ...conversion, ingredientId });
    if (existingConversionsByLabel.has(labelKey)) {
      const existing = existingConversionsByLabel.get(labelKey)!;
      conversionIdMap.set(conversion.id, { id: existing.id, ingredientId: existing.ingredientId });
      warnings.push(`Reused existing conversion "${conversion.label}" for ingredient ${ingredientId}.`);
      continue;
    }

    let nextId = conversion.id;
    if (reservedConversionIds.has(nextId)) {
      nextId = makeId();
    }

    reservedConversionIds.add(nextId);
    const saved = { ...conversion, id: nextId, ingredientId };
    conversionsToSave.push(saved);
    conversionIdMap.set(conversion.id, { id: nextId, ingredientId });
    existingConversionsByLabel.set(labelKey, saved);
  }

  const recipeIdMap = new Map<string, string>();
  const recipesToSave: Recipe[] = [];
  const reservedRecipeIds = new Set(existingRecipes.map((recipe) => recipe.id));

  for (const recipe of backup.data.recipes) {
    let nextId = recipe.id;
    if (reservedRecipeIds.has(nextId)) {
      nextId = makeId();
    }
    reservedRecipeIds.add(nextId);
    recipeIdMap.set(recipe.id, nextId);

    const ingredients = recipe.ingredients.map((ingredient) => {
      const ingredientId = ingredientIdMap.get(ingredient.id) ?? ingredient.id;
      if (ingredient.unitConversionId) {
        const mapped = conversionIdMap.get(ingredient.unitConversionId);
        if (!mapped) {
          throw new RestoreBackupError(`Recipe "${recipe.name}" references missing conversion ${ingredient.unitConversionId}.`);
        }
        if (mapped.ingredientId !== ingredientId) {
          throw new RestoreBackupError(`Recipe "${recipe.name}" references a conversion that belongs to a different ingredient.`);
        }
        return { ...ingredient, id: ingredientId, unitConversionId: mapped.id };
      }
      return { ...ingredient, id: ingredientId };
    });

    recipesToSave.push({ ...recipe, id: nextId, ingredients });
  }

  const calculationsToSave: SavedCalculation[] = backup.data.dryToCookedCalculations.map((calculation) => ({
    ...calculation,
    id: existingCalculations.some((existing) => existing.id === calculation.id) ? makeId() : calculation.id,
  }));

  const mealPlanEntriesToSave: MealPlanEntry[] = backup.data.mealPlanEntries.map((entry) => {
    const recipeId = recipeIdMap.get(entry.recipeId) ?? entry.recipeId;
    if (!recipeIdMap.has(entry.recipeId) && !existingRecipes.some((recipe) => recipe.id === recipeId)) {
      throw new RestoreBackupError(`Meal plan entry references missing recipe ${entry.recipeId}.`);
    }

    return {
      ...entry,
      id: existingMealPlanEntries.some((existing) => existing.id === entry.id) ? makeId() : entry.id,
      recipeId,
    };
  });

  for (const ingredient of ingredientsToSave) {
    if (supabase) {
      await supabaseIngredientRepository.save(ingredient);
    } else {
      ingredientRepository.save(ingredient);
    }
  }

  for (const conversion of conversionsToSave) {
    await unitConversionRepository.save(conversion);
  }

  for (const recipe of recipesToSave) {
    if (supabase) {
      await supabaseRecipeRepository.save(recipe);
    } else {
      recipeRepository.save(recipe);
    }
  }

  for (const calculation of calculationsToSave) {
    if (supabase) {
      await supabaseCalcRepository.save(calculation);
    } else {
      dryToCookedRepository.save(calculation);
    }
  }

  for (const entry of mealPlanEntriesToSave) {
    await mealPlanRepository.save(entry);
  }

  return {
    ingredients: ingredientsToSave.length,
    ingredientUnitConversions: conversionsToSave.length,
    recipes: recipesToSave.length,
    dryToCookedCalculations: calculationsToSave.length,
    mealPlanEntries: mealPlanEntriesToSave.length,
    warnings,
  };
}

export async function exportBackup(): Promise<void> {
  const data = await createBackupData();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `meal-prep-companion-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
