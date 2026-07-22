import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createBackupData, restoreBackupData, RestoreBackupError } from './backup-service';
import { getSupabaseClientOrNull } from '@/infrastructure/supabase/client';
import { ingredientRepository } from '@/features/ingredients/repositories/ingredient.repository';
import { recipeRepository } from '@/features/recipes/repositories/recipe.repository';
import { supabaseIngredientRepository } from '@/features/ingredients/repositories/supabase-ingredient.repository';
import { supabaseRecipeRepository } from '@/features/recipes/repositories/supabase-recipe.repository';
import { supabaseCalcRepository } from '@/features/dry-to-cooked/repositories/supabase-calc.repository';
import { unitConversionRepository } from '@/features/ingredients/conversions/unit-conversion.repository';
import { mealPlanRepository } from '@/features/planner/repositories/meal-plan.repository';

vi.mock('@/infrastructure/supabase/client', () => ({
  getSupabaseClientOrNull: vi.fn(),
}));

const importedIngredient = {
  id: 'ing-usda',
  name: 'Chicken Breast',
  caloriesPer100g: 165,
  proteinPer100g: 31,
  carbsPer100g: 0,
  fatPer100g: 3.6,
  category: 'Protein',
  source: 'usda' as const,
  externalSourceId: '123',
  externalSourceName: 'Chicken Breast, meat only',
  importedAt: 1721600000000,
  createdAt: 1721600000000,
  updatedAt: 1721600000000,
};

const conversion = {
  id: 'conv-1',
  ingredientId: 'ing-usda',
  unit: 'piece' as const,
  label: '1 piece',
  gramsPerUnit: 120,
  isDefault: false,
  sourceType: 'usda' as const,
  externalSourceId: '123',
  createdAt: 1721600000000,
  updatedAt: 1721600000000,
};

const recipe = {
  id: 'recipe-1',
  name: 'Chicken Bowl',
  portions: 2,
  ingredients: [
    {
      id: 'ing-usda',
      name: 'Chicken Breast',
      weight: 2,
      unit: 'piece',
      unitConversionId: 'conv-1',
      caloriesPer100g: 165,
      proteinPer100g: 31,
      carbsPer100g: 0,
      fatPer100g: 3.6,
    },
  ],
  createdAt: 1721600000000,
  updatedAt: 1721600000000,
  tags: [],
  favourite: false,
  notes: '',
};

const calculation = {
  id: 'calc-1',
  name: 'Rice',
  dryWeight: 100,
  cookedWeight: 250,
  dryCaloriesPer100g: 360,
  dryProteinPer100g: 7,
  dryCarbsPer100g: 80,
  dryFatPer100g: 1,
  nutritionBasis: 100,
  portions: 2,
  dryServingWeight: 50,
  createdAt: 1721600000000,
  updatedAt: 1721600000000,
};

const mealPlanEntry = {
  id: 'meal-1',
  recipeId: 'recipe-1',
  plannedDate: '2026-07-22',
  mealSlot: 'lunch' as const,
  servings: 1,
  notes: '',
  position: 0,
  createdAt: 1721600000000,
  updatedAt: 1721600000000,
};

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

afterEach(() => {
  localStorage.clear();
});

describe('backup-service', () => {
  it('exports and restores a v1.3 round-trip with provenance, conversions, recipe units, and planner data', async () => {
    vi.mocked(getSupabaseClientOrNull).mockReturnValue({} as never);

    vi.spyOn(supabaseIngredientRepository, 'getAll')
      .mockResolvedValueOnce([importedIngredient])
      .mockResolvedValueOnce([]);
    vi.spyOn(supabaseRecipeRepository, 'getAll')
      .mockResolvedValueOnce([recipe])
      .mockResolvedValueOnce([]);
    vi.spyOn(supabaseCalcRepository, 'getAll')
      .mockResolvedValueOnce([calculation])
      .mockResolvedValueOnce([]);
    vi.spyOn(unitConversionRepository, 'listForIngredient').mockResolvedValue([conversion]);
    vi.spyOn(mealPlanRepository, 'getAll')
      .mockResolvedValueOnce([mealPlanEntry])
      .mockResolvedValueOnce([]);

    const ingredientSave = vi.spyOn(supabaseIngredientRepository, 'save').mockResolvedValue(importedIngredient);
    const conversionSave = vi.spyOn(unitConversionRepository, 'save').mockResolvedValue(conversion);
    const recipeSave = vi.spyOn(supabaseRecipeRepository, 'save').mockResolvedValue(recipe);
    const calcSave = vi.spyOn(supabaseCalcRepository, 'save').mockResolvedValue(calculation);
    const mealSave = vi.spyOn(mealPlanRepository, 'save').mockResolvedValue(mealPlanEntry);

    const backup = await createBackupData();

    expect(backup.formatVersion).toBe(2);
    expect(backup.data.ingredients[0].externalSourceId).toBe('123');
    expect(backup.data.ingredientUnitConversions).toEqual([conversion]);
    expect(backup.data.recipes[0].ingredients[0].unit).toBe('piece');
    expect(backup.data.recipes[0].ingredients[0].unitConversionId).toBe('conv-1');
    const raw = JSON.stringify(backup);
    expect(raw).not.toContain('quantityGrams');
    expect(raw).not.toContain('totalCalories');
    expect(raw).not.toContain('gramsEquivalent');

    const result = await restoreBackupData(backup);

    expect(result).toEqual({
      ingredients: 1,
      ingredientUnitConversions: 1,
      recipes: 1,
      dryToCookedCalculations: 1,
      mealPlanEntries: 1,
      warnings: [],
    });
    expect(ingredientSave.mock.invocationCallOrder[0]).toBeLessThan(conversionSave.mock.invocationCallOrder[0]);
    expect(conversionSave.mock.invocationCallOrder[0]).toBeLessThan(recipeSave.mock.invocationCallOrder[0]);
    expect(recipeSave.mock.invocationCallOrder[0]).toBeLessThan(mealSave.mock.invocationCallOrder[0]);
    expect(calcSave).toHaveBeenCalledTimes(1);
    expect(recipeSave.mock.calls[0]?.[0].ingredients[0].unitConversionId).toBe('conv-1');
  });

  it('restores an old gram-only backup by translating quantityGrams', async () => {
    vi.mocked(getSupabaseClientOrNull).mockReturnValue(null);

    await restoreBackupData({
      application: 'meal-prep-companion',
      exportedAt: '2026-07-22T00:00:00.000Z',
      formatVersion: 1,
      data: {
        ingredients: [
          {
            id: 'ing-1',
            name: 'Chicken Breast',
            caloriesPer100g: 165,
            proteinPer100g: 31,
            carbsPer100g: 0,
            fatPer100g: 3.6,
            category: 'Protein',
            source: 'custom',
            externalSourceId: null,
            externalSourceName: null,
            importedAt: null,
            createdAt: 1,
            updatedAt: 1,
          },
        ],
        recipes: [
          {
            id: 'recipe-1',
            name: 'Legacy Chicken',
            portions: 2,
            ingredients: [
              {
                id: 'ing-1',
                name: 'Chicken Breast',
                quantityGrams: 250,
                caloriesPer100g: 165,
                proteinPer100g: 31,
                carbsPer100g: 0,
                fatPer100g: 3.6,
              },
            ],
            createdAt: 1,
            updatedAt: 1,
            tags: [],
            favourite: false,
            notes: '',
          },
        ],
        dryToCookedCalculations: [],
      },
    });

    const saved = recipeRepository.getAll()[0];
    expect(saved.ingredients[0]).toMatchObject({ weight: 250, unit: 'g', unitConversionId: null });
  });

  it('rejects recipes that reference missing conversions and preserves current data', async () => {
    vi.mocked(getSupabaseClientOrNull).mockReturnValue(null);

    ingredientRepository.save({
      id: 'existing-ing',
      name: 'Existing Ingredient',
      caloriesPer100g: 100,
      proteinPer100g: 10,
      carbsPer100g: 0,
      fatPer100g: 0,
      category: '',
      source: 'custom',
      externalSourceId: null,
      externalSourceName: null,
      importedAt: null,
      createdAt: 1,
      updatedAt: 1,
    });
    recipeRepository.save({
      id: 'existing-recipe',
      name: 'Existing Recipe',
      portions: 1,
      ingredients: [{ id: 'existing-ing', name: 'Existing Ingredient', weight: 100, unit: 'g', unitConversionId: null, caloriesPer100g: 100, proteinPer100g: 10, carbsPer100g: 0, fatPer100g: 0 }],
      createdAt: 1,
      updatedAt: 1,
      tags: [],
      favourite: false,
      notes: '',
    });

    await expect(restoreBackupData({
      application: 'meal-prep-companion',
      exportedAt: '2026-07-22T00:00:00.000Z',
      formatVersion: 2,
      data: {
        ingredients: [importedIngredient],
        ingredientUnitConversions: [],
        recipes: [{ ...recipe, ingredients: [{ ...recipe.ingredients[0], unitConversionId: 'missing-conv' }] }],
        dryToCookedCalculations: [],
        mealPlanEntries: [],
      },
    })).rejects.toBeInstanceOf(RestoreBackupError);

    expect(ingredientRepository.getAll().map((ingredient) => ingredient.id)).toEqual(['existing-ing']);
    expect(recipeRepository.getAll().map((savedRecipe) => savedRecipe.id)).toEqual(['existing-recipe']);
  });

  it('reuses an existing imported ingredient to avoid duplicate external source conflicts', async () => {
    vi.mocked(getSupabaseClientOrNull).mockReturnValue({} as never);

    const existingImported = { ...importedIngredient, id: 'existing-import' };
    vi.spyOn(supabaseIngredientRepository, 'getAll').mockResolvedValue([existingImported]);
    vi.spyOn(supabaseRecipeRepository, 'getAll').mockResolvedValue([]);
    vi.spyOn(supabaseCalcRepository, 'getAll').mockResolvedValue([]);
    vi.spyOn(mealPlanRepository, 'getAll').mockResolvedValue([]);
    vi.spyOn(unitConversionRepository, 'listForIngredient').mockResolvedValue([]);

    const ingredientSave = vi.spyOn(supabaseIngredientRepository, 'save').mockResolvedValue(existingImported);
    const recipeSave = vi.spyOn(supabaseRecipeRepository, 'save').mockResolvedValue({
      ...recipe,
      ingredients: [{ ...recipe.ingredients[0], id: 'existing-import' }],
    });

    const result = await restoreBackupData({
      application: 'meal-prep-companion',
      exportedAt: '2026-07-22T00:00:00.000Z',
      formatVersion: 2,
      data: {
        ingredients: [importedIngredient],
        ingredientUnitConversions: [],
        recipes: [{
          ...recipe,
          ingredients: [{ ...recipe.ingredients[0], unitConversionId: null }],
        }],
        dryToCookedCalculations: [],
        mealPlanEntries: [],
      },
    });

    expect(ingredientSave).not.toHaveBeenCalled();
    expect(recipeSave.mock.calls[0]?.[0].ingredients[0].id).toBe('existing-import');
    expect(result.warnings[0]).toContain('Reused existing imported ingredient');
  });
});
