import type { Recipe } from '../schemas/recipe.schema';
import { recipeSchema } from '../schemas/recipe.schema';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { mapRecipeRows, recipeToRow } from './recipe-mapper';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cast(row: unknown): any {
  return row;
}

export const supabaseRecipeRepository = {
  async getAll(): Promise<Recipe[]> {
    const supabase = getSupabaseClient();
    const [recipesRes, riRes, ingRes] = await Promise.all([
      supabase.from('recipes').select('*').order('created_at', { ascending: false }),
      supabase.from('recipe_ingredients').select('*').order('position'),
      supabase.from('ingredients').select('*'),
    ]);

    if (recipesRes.error) {
      console.error('Failed to load recipes:', recipesRes.error);
      return [];
    }

    const mapped = mapRecipeRows(recipesRes.data, riRes.data || [], ingRes.data || []);
    const valid: Recipe[] = [];
    for (const r of mapped) {
      const result = recipeSchema.safeParse(r);
      if (result.success) valid.push(result.data);
      else console.warn('Skipping invalid recipe:', result.error.issues);
    }
    return valid;
  },

  async getById(id: string): Promise<Recipe | undefined> {
    const supabase = getSupabaseClient();
    const [recipeRes, riRes, ingRes] = await Promise.all([
      supabase.from('recipes').select('*').eq('id', id).single(),
      supabase.from('recipe_ingredients').select('*').eq('recipe_id', id).order('position'),
      supabase.from('ingredients').select('*'),
    ]);

    if (recipeRes.error || !recipeRes.data) return undefined;
    const mapped = mapRecipeRows([recipeRes.data], riRes.data || [], ingRes.data || []);
    const result = recipeSchema.safeParse(mapped[0]);
    return result.success ? result.data : undefined;
  },

  async save(recipe: Recipe): Promise<Recipe> {
    const supabase = getSupabaseClient();
    const { data: user } = await supabase.auth.getUser();
    const userId = user.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const existing = await this.getById(recipe.id);
    const recipeRow = recipeToRow(recipe, userId);

    if (existing) {
      const { error } = await supabase.from('recipes').update(cast(recipeRow)).eq('id', recipe.id);
      if (error) throw new Error(`Failed to update recipe: ${error.message}`);
    } else {
      const { error } = await supabase.from('recipes').insert(cast({ ...recipeRow, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }));
      if (error) throw new Error(`Failed to create recipe: ${error.message}`);
    }

    await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipe.id);

    if (recipe.ingredients.length > 0) {
      const riRows = recipe.ingredients.map((ing, idx) => ({
        id: ing.id,
        recipe_id: recipe.id,
        ingredient_id: ing.id,
        quantity: ing.weight,
        unit: 'g',
        position: idx,
      }));
      const { error: riError } = await supabase.from('recipe_ingredients').insert(cast(riRows));
      if (riError) throw new Error(`Failed to save recipe ingredients: ${riError.message}`);
    }

    const saved = await this.getById(recipe.id);
    if (!saved) throw new Error('Recipe not found after save');
    return saved;
  },

  async delete(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { count } = await supabase.from('meal_plan_entries').select('id', { count: 'exact', head: true }).eq('recipe_id', id);
    if (count && count > 0) {
      throw new Error(`This recipe is used in ${count} meal plan entr${count === 1 ? 'y' : 'ies'}. Remove it from the planner first.`);
    }
    await supabase.from('recipe_ingredients').delete().eq('recipe_id', id);
    const { error } = await supabase.from('recipes').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete recipe: ${error.message}`);
  },

  async duplicate(recipe: Recipe, newId: string, newName: string, newCreatedAt: number): Promise<void> {
    const dup: Recipe = {
      ...recipe,
      id: newId,
      name: newName,
      createdAt: newCreatedAt,
      ingredients: recipe.ingredients.map((ing) => ({ ...ing, id: crypto.randomUUID() })),
    };
    await this.save(dup);
  },

  async clear(): Promise<void> {
    const supabase = getSupabaseClient();
    await supabase.from('recipe_ingredients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('recipes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  },
};
