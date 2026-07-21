import type { UnitConversion } from './unit-conversion.schema';
import { INGREDIENT_UNITS } from '@/shared/units/types';
import type { Database } from '@/infrastructure/supabase/database.types';

type Row = Database['public']['Tables']['ingredient_unit_conversions']['Row'];

export function mapConversionRow(row: Row): UnitConversion {
  return {
    id: row.id,
    ingredientId: row.ingredient_id || '',
    unit: (INGREDIENT_UNITS as readonly string[]).includes(row.unit) ? (row.unit as UnitConversion['unit']) : 'cup',
    label: row.label,
    gramsPerUnit: row.grams_per_unit,
    isDefault: row.is_default,
    sourceType: (row.source_type === 'usda' || row.source_type === 'open-food-facts') ? row.source_type : 'manual',
    externalSourceId: row.external_source_id,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export function conversionToRow(
  conv: UnitConversion,
  userId: string,
): Database['public']['Tables']['ingredient_unit_conversions']['Insert'] {
  return {
    id: conv.id,
    user_id: userId,
    ingredient_id: conv.ingredientId,
    unit: conv.unit,
    label: conv.label,
    grams_per_unit: conv.gramsPerUnit,
    is_default: conv.isDefault,
    source_type: conv.sourceType,
    external_source_id: conv.externalSourceId,
  };
}
