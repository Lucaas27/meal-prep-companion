import type { MealPlanEntry } from '../schemas/meal-plan.schema';
import { mealPlanEntrySchema } from '../schemas/meal-plan.schema';
import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { mapEntryRow, entryToRow } from './meal-plan-mapper';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cast(row: unknown): any {
  return row;
}

export const mealPlanRepository = {
  async getAll(): Promise<MealPlanEntry[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from('meal_plan_entries').select('*').order('position');

    if (error) return [];
    const valid: MealPlanEntry[] = [];
    for (const row of data) {
      const mapped = mapEntryRow(row);
      const result = mealPlanEntrySchema.safeParse(mapped);
      if (result.success) valid.push(result.data);
    }
    return valid;
  },

  async getByDateRange(startDate: string, endDate: string): Promise<MealPlanEntry[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('meal_plan_entries')
      .select('*')
      .gte('planned_date', startDate)
      .lte('planned_date', endDate)
      .order('position');

    if (error) return [];
    const valid: MealPlanEntry[] = [];
    for (const row of data) {
      const mapped = mapEntryRow(row);
      const result = mealPlanEntrySchema.safeParse(mapped);
      if (result.success) valid.push(result.data);
    }
    return valid;
  },

  async save(entry: MealPlanEntry): Promise<MealPlanEntry> {
    const supabase = getSupabaseClient();
    const { data: user } = await supabase.auth.getUser();
    const userId = user.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const all = await this.getAll();
    const existing = all.find((e) => e.id === entry.id);
    const row = entryToRow(entry, userId);

    if (existing) {
      const { error } = await supabase.from('meal_plan_entries').update(cast(row)).eq('id', entry.id);
      if (error) throw new Error(`Failed to update entry: ${error.message}`);
    } else {
      const { error } = await supabase
        .from('meal_plan_entries')
        .insert(cast({ ...row, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }));
      if (error) throw new Error(`Failed to create entry: ${error.message}`);
    }

    const saved = (await this.getAll()).find((e) => e.id === entry.id);
    if (!saved) throw new Error('Entry not found after save');
    return saved;
  },

  async delete(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('meal_plan_entries').delete().eq('id', id);
    if (error) throw new Error(`Failed to delete entry: ${error.message}`);
  },
};
