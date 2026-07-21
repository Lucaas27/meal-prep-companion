import type { StoredIngredient } from '../schemas/ingredient.schema';
import { storedIngredientSchema } from '../schemas/ingredient.schema';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { mapIngredientRow, ingredientToRow } from './ingredient-mapper';
import { normaliseName } from '@/shared/utils/format';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asInsert(row: Record<string, unknown>): any {
  return row;
}

export const supabaseIngredientRepository = {
  async getAll(): Promise<StoredIngredient[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('ingredients').select('*').order('name');

    if (error) {
      console.error('Failed to load ingredients:', error);
      return [];
    }

    const valid: StoredIngredient[] = [];
    for (const row of data) {
      const mapped = mapIngredientRow(row);
      const result = storedIngredientSchema.safeParse(mapped);
      if (result.success) {
        valid.push(result.data);
      } else {
        console.warn('Skipping invalid ingredient row:', result.error.issues);
      }
    }
    return valid;
  },

  async getById(id: string): Promise<StoredIngredient | undefined> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('ingredients').select('*').eq('id', id).single();

    if (error || !data) return undefined;
    const mapped = mapIngredientRow(data);
    const result = storedIngredientSchema.safeParse(mapped);
    return result.success ? result.data : undefined;
  },

  async save(ingredient: StoredIngredient): Promise<StoredIngredient> {
    const supabase = getSupabaseClient();
    const { data: user } = await supabase.auth.getUser();
    const userId = user.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const existing = await this.getById(ingredient.id);
    const row = ingredientToRow(ingredient, userId);

    if (existing) {
      const { error } = await supabase
        .from('ingredients')
        .update(asInsert(row))
        .eq('id', ingredient.id);

      if (error) {
        throw new Error(`Failed to update ingredient: ${error.message}`);
      }
    } else {
      const { error } = await supabase
        .from('ingredients')
        .insert(asInsert({ ...row, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }));

      if (error) {
        throw new Error(`Failed to create ingredient: ${error.message}`);
      }
    }

    const saved = await this.getById(ingredient.id);
    if (!saved) throw new Error('Ingredient not found after save');
    return saved;
  },

  async delete(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('ingredients').delete().eq('id', id);

    if (error) {
      throw new Error(`Failed to delete ingredient: ${error.message}`);
    }
  },

  async existsByNormalisedName(name: string, excludeId?: string): Promise<boolean> {
    const all = await this.getAll();
    const needle = normaliseName(name);
    return all.some((i) => normaliseName(i.name) === needle && i.id !== excludeId);
  },

  async clear(): Promise<void> {
    const supabase = getSupabaseClient();
    const { data } = await supabase.from('ingredients').select('id');
    if (data && data.length > 0) {
      const ids = data.map((r) => r.id);
      await supabase.from('ingredients').delete().in('id', ids);
    }
  },
};
