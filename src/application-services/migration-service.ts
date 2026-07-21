import { ingredientRepository } from '@/features/ingredients/repositories/ingredient.repository';
import { recipeRepository } from '@/features/recipes/repositories/recipe.repository';
import { dryToCookedRepository } from '@/features/dry-to-cooked/repositories/dry-to-cooked.repository';
import { supabaseIngredientRepository } from '@/features/ingredients/repositories/supabase-ingredient.repository';
import { supabaseRecipeRepository } from '@/features/recipes/repositories/supabase-recipe.repository';
import { supabaseCalcRepository } from '@/features/dry-to-cooked/repositories/supabase-calc.repository';
import { getSupabaseClientOrNull } from '@/infrastructure/supabase/client';
import { exportBackup } from './backup-service';

const MIGRATION_KEY = 'local-storage-v1';

interface MigrationCounts {
  ingredients: number;
  recipes: number;
  calculations: number;
  skipped: number;
}

export interface MigrationStatus {
  hasLocalData: boolean;
  alreadyMigrated: boolean;
  counts: MigrationCounts;
}

export async function getMigrationStatus(): Promise<MigrationStatus> {
  const supabase = getSupabaseClientOrNull();

  const localIngredients = ingredientRepository.getAll();
  const localRecipes = recipeRepository.getAll();
  const localCalculations = dryToCookedRepository.getAll();

  const hasLocalData = localIngredients.length > 0 || localRecipes.length > 0 || localCalculations.length > 0;

  let alreadyMigrated = false;
  if (hasLocalData && supabase) {
    try {
      const { data } = await supabase
        .from('data_migrations')
        .select('id')
        .eq('migration_key', MIGRATION_KEY)
        .maybeSingle();
      alreadyMigrated = !!data;
    } catch {
      // Supabase not available, assume not migrated
    }
  }

  return {
    hasLocalData,
    alreadyMigrated,
    counts: {
      ingredients: localIngredients.length,
      recipes: localRecipes.length,
      calculations: localCalculations.length,
      skipped: 0,
    },
  };
}

export async function runMigration(): Promise<MigrationCounts> {
  const supabase = getSupabaseClientOrNull();
  if (!supabase) throw new Error('Supabase not configured');
  const counts: MigrationCounts = { ingredients: 0, recipes: 0, calculations: 0, skipped: 0 };

  const localIngredients = ingredientRepository.getAll();
  for (const ing of localIngredients) {
    try {
      await supabaseIngredientRepository.save(ing);
      counts.ingredients++;
    } catch (err) {
      console.warn(`Skipping ingredient "${ing.name}":`, err);
      counts.skipped++;
    }
  }

  const localRecipes = recipeRepository.getAll();
  for (const recipe of localRecipes) {
    try {
      await supabaseRecipeRepository.save(recipe);
      counts.recipes++;
    } catch (err) {
      console.warn(`Skipping recipe "${recipe.name}":`, err);
      counts.skipped++;
    }
  }

  const localCalculations = dryToCookedRepository.getAll();
  for (const calc of localCalculations) {
    try {
      await supabaseCalcRepository.save(calc);
      counts.calculations++;
    } catch (err) {
      console.warn(`Skipping calculation "${calc.name}":`, err);
      counts.skipped++;
    }
  }

  const { data: user } = await supabase.auth.getUser();
  const userId = user.user?.id;
  if (!userId) throw new Error('Not authenticated');

  await supabase.from('data_migrations').upsert(
    { user_id: userId, migration_key: MIGRATION_KEY, applied_at: new Date().toISOString() },
    { onConflict: 'user_id, migration_key' },
  );

  return counts;
}

export function downloadBackup() {
  exportBackup();
}

export function clearLocalData() {
  ingredientRepository.clear();
  recipeRepository.clear();
  dryToCookedRepository.clear();
}
