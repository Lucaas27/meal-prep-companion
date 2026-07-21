import type { SavedCalculation } from '../schemas/saved-calculation.schema';
import { savedCalculationSchema } from '../schemas/saved-calculation.schema';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { mapCalcRow, calcToRow } from './calc-mapper';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cast(row: unknown): any {
  return row;
}

export const supabaseCalcRepository = {
  async getAll(): Promise<SavedCalculation[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('dry_to_cooked_calculations').select('*').order('updated_at', { ascending: false });

    if (error) {
      console.error('Failed to load calculations:', error);
      return [];
    }

    const valid: SavedCalculation[] = [];
    for (const row of data) {
      const mapped = mapCalcRow(row);
      const result = savedCalculationSchema.safeParse(mapped);
      if (result.success) valid.push(result.data);
      else console.warn('Skipping invalid calculation:', result.error.issues);
    }
    return valid;
  },

  async save(calc: SavedCalculation): Promise<SavedCalculation> {
    const supabase = getSupabaseClient();
    const { data: user } = await supabase.auth.getUser();
    const userId = user.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const all = await this.getAll();
    const existing = all.find((c) => c.id === calc.id);
    const row = calcToRow(calc, userId);

    if (existing) {
      const { error } = await supabase.from('dry_to_cooked_calculations').update(cast(row)).eq('id', calc.id);
      if (error) throw new Error(`Failed to update calculation: ${error.message}`);
    } else {
      const { error } = await supabase.from('dry_to_cooked_calculations').insert(cast({ ...row, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }));
      if (error) throw new Error(`Failed to create calculation: ${error.message}`);
    }

    const saved = (await this.getAll()).find((c) => c.id === calc.id);
    if (!saved) throw new Error('Calculation not found after save');
    return saved;
  },

  async delete(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('dry_to_cooked_calculations').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete calculation: ${error.message}`);
  },

  async duplicate(source: SavedCalculation, newId: string): Promise<void> {
    const dup: SavedCalculation = {
      ...source,
      id: newId,
      name: `${source.name} (copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await this.save(dup);
  },

  async clear(): Promise<void> {
    const supabase = getSupabaseClient();
    await supabase.from('dry_to_cooked_calculations').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  },
};
