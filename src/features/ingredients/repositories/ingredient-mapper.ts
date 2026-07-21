import type { StoredIngredient } from '@/features/ingredients/schemas/ingredient.schema';
import type { Database } from '@/infrastructure/supabase/database.types';

type IngredientRow = Database['public']['Tables']['ingredients']['Row'];

export function mapIngredientRow(row: IngredientRow): StoredIngredient {
  return {
    id: row.id,
    name: row.name,
    caloriesPer100g: row.calories_per_100g,
    proteinPer100g: row.protein_per_100g,
    carbsPer100g: row.carbs_per_100g,
    fatPer100g: row.fat_per_100g,
    category: row.category ?? '',
    source: (row.source === 'starter' ? 'starter' : 'custom') as 'starter' | 'custom',
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export function ingredientToRow(
  ingredient: StoredIngredient,
  userId: string,
): Database['public']['Tables']['ingredients']['Insert'] {
  return {
    id: ingredient.id,
    user_id: userId,
    name: ingredient.name,
    normalized_name: ingredient.name.trim().toLowerCase().replace(/\s+/g, ' '),
    calories_per_100g: ingredient.caloriesPer100g,
    protein_per_100g: ingredient.proteinPer100g,
    carbs_per_100g: ingredient.carbsPer100g,
    fat_per_100g: ingredient.fatPer100g,
    category: ingredient.category || null,
    source: ingredient.source || null,
  };
}
