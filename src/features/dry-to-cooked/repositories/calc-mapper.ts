import type { SavedCalculation } from '../schemas/saved-calculation.schema';
import type { Database } from '@/infrastructure/supabase/database.types';

type CalcRow = Database['public']['Tables']['dry_to_cooked_calculations']['Row'];

export function mapCalcRow(row: CalcRow): SavedCalculation {
  return {
    id: row.id,
    name: row.name,
    dryWeight: row.dry_weight,
    cookedWeight: row.cooked_weight,
    dryCaloriesPer100g: row.calories_per_100g,
    dryProteinPer100g: row.protein_per_100g,
    dryCarbsPer100g: row.carbs_per_100g,
    dryFatPer100g: row.fat_per_100g,
    nutritionBasis: row.nutrition_basis,
    portions: row.portions,
    dryServingWeight: row.dry_serving_weight,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export function calcToRow(
  calc: SavedCalculation,
  userId: string,
): Database['public']['Tables']['dry_to_cooked_calculations']['Insert'] {
  return {
    id: calc.id,
    user_id: userId,
    name: calc.name,
    dry_weight: calc.dryWeight,
    cooked_weight: calc.cookedWeight,
    calories_per_100g: calc.dryCaloriesPer100g,
    protein_per_100g: calc.dryProteinPer100g,
    carbs_per_100g: calc.dryCarbsPer100g,
    fat_per_100g: calc.dryFatPer100g,
    nutrition_basis: calc.nutritionBasis,
    portions: calc.portions,
    dry_serving_weight: calc.dryServingWeight,
  };
}
