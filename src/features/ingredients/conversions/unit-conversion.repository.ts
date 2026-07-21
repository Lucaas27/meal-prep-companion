import type { UnitConversion } from './unit-conversion.schema';
import { unitConversionSchema } from './unit-conversion.schema';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { mapConversionRow, conversionToRow } from './unit-conversion-mapper';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cast(row: unknown): any {
  return row;
}

export const unitConversionRepository = {
  async listForIngredient(ingredientId: string): Promise<UnitConversion[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('ingredient_unit_conversions')
      .select('*')
      .eq('ingredient_id', ingredientId)
      .order('is_default', { ascending: false })
      .order('label');

    if (error) return [];

    const valid: UnitConversion[] = [];
    for (const row of data) {
      const mapped = mapConversionRow(row);
      const result = unitConversionSchema.safeParse(mapped);
      if (result.success) valid.push(result.data);
    }
    return valid;
  },

  async getById(id: string): Promise<UnitConversion | undefined> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('ingredient_unit_conversions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) return undefined;
    const mapped = mapConversionRow(data);
    const result = unitConversionSchema.safeParse(mapped);
    return result.success ? result.data : undefined;
  },

  async save(conv: UnitConversion): Promise<UnitConversion> {
    const supabase = getSupabaseClient();
    const { data: user } = await supabase.auth.getUser();
    const userId = user.user?.id;
    if (!userId) throw new Error('Not authenticated');

    if (conv.isDefault) {
      await supabase
        .from('ingredient_unit_conversions')
        .update({ is_default: false })
        .eq('ingredient_id', conv.ingredientId)
        .neq('id', conv.id);
    }

    const existing = await this.getById(conv.id);
    const row = conversionToRow(conv, userId);

    if (existing) {
      const { error } = await supabase
        .from('ingredient_unit_conversions')
        .update(cast(row))
        .eq('id', conv.id);
      if (error) throw new Error(`Failed to update conversion: ${error.message}`);
    } else {
      const { error } = await supabase
        .from('ingredient_unit_conversions')
        .insert(cast({ ...row, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }));
      if (error) throw new Error(`Failed to create conversion: ${error.message}`);
    }

    const saved = await this.getById(conv.id);
    if (!saved) throw new Error('Conversion not found after save');
    return saved;
  },

  async delete(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
      .from('ingredient_unit_conversions')
      .delete()
      .eq('id', id);
    if (error) throw new Error(`Failed to delete conversion: ${error.message}`);
  },
};
