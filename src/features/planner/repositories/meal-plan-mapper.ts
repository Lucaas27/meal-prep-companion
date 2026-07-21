import type { MealPlanEntry } from '../schemas/meal-plan.schema';
import type { Database } from '@/infrastructure/supabase/database.types';
import { MEAL_SLOTS } from '../schemas/meal-plan.schema';

type Row = Database['public']['Tables']['meal_plan_entries']['Row'];

export function mapEntryRow(row: Row): MealPlanEntry {
  return {
    id: row.id,
    recipeId: row.recipe_id,
    plannedDate: row.planned_date,
    mealSlot: (MEAL_SLOTS as readonly string[]).includes(row.meal_slot)
      ? (row.meal_slot as MealPlanEntry['mealSlot'])
      : 'breakfast',
    servings: row.servings,
    notes: row.notes ?? '',
    position: row.position,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export function entryToRow(
  entry: MealPlanEntry,
  userId: string,
): Database['public']['Tables']['meal_plan_entries']['Insert'] {
  return {
    id: entry.id,
    user_id: userId,
    recipe_id: entry.recipeId,
    planned_date: entry.plannedDate,
    meal_slot: entry.mealSlot,
    servings: entry.servings,
    notes: entry.notes || null,
    position: entry.position,
  };
}
