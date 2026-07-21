import { z } from 'zod';

export const WEIGHT_UNITS = ['mg', 'g', 'kg', 'oz', 'lb'] as const;
export const INGREDIENT_UNITS = ['ml', 'l', 'tsp', 'tbsp', 'cup', 'item', 'piece', 'slice', 'clove', 'can', 'pack'] as const;

export const UNIT_IDS = [...WEIGHT_UNITS, ...INGREDIENT_UNITS] as const;

export type WeightUnit = (typeof WEIGHT_UNITS)[number];
export type IngredientUnit = (typeof INGREDIENT_UNITS)[number];
export type UnitId = (typeof UNIT_IDS)[number];

export const unitSchema = z.enum(UNIT_IDS);

export const weightUnitSchema = z.enum(WEIGHT_UNITS);

export interface UnitMeta {
  id: UnitId;
  abbr: string;
  singular: string;
  plural: string;
  category: 'weight' | 'ingredient';
}

export const UNIT_META: Record<UnitId, UnitMeta> = {
  mg: { id: 'mg', abbr: 'mg', singular: 'milligram', plural: 'milligrams', category: 'weight' },
  g: { id: 'g', abbr: 'g', singular: 'gram', plural: 'grams', category: 'weight' },
  kg: { id: 'kg', abbr: 'kg', singular: 'kilogram', plural: 'kilograms', category: 'weight' },
  oz: { id: 'oz', abbr: 'oz', singular: 'ounce', plural: 'ounces', category: 'weight' },
  lb: { id: 'lb', abbr: 'lb', singular: 'pound', plural: 'pounds', category: 'weight' },
  ml: { id: 'ml', abbr: 'ml', singular: 'millilitre', plural: 'millilitres', category: 'ingredient' },
  l: { id: 'l', abbr: 'L', singular: 'litre', plural: 'litres', category: 'ingredient' },
  tsp: { id: 'tsp', abbr: 'tsp', singular: 'teaspoon', plural: 'teaspoons', category: 'ingredient' },
  tbsp: { id: 'tbsp', abbr: 'tbsp', singular: 'tablespoon', plural: 'tablespoons', category: 'ingredient' },
  cup: { id: 'cup', abbr: 'cup', singular: 'cup', plural: 'cups', category: 'ingredient' },
  item: { id: 'item', abbr: 'item', singular: 'item', plural: 'items', category: 'ingredient' },
  piece: { id: 'piece', abbr: 'pc', singular: 'piece', plural: 'pieces', category: 'ingredient' },
  slice: { id: 'slice', abbr: 'slice', singular: 'slice', plural: 'slices', category: 'ingredient' },
  clove: { id: 'clove', abbr: 'clove', singular: 'clove', plural: 'cloves', category: 'ingredient' },
  can: { id: 'can', abbr: 'can', singular: 'can', plural: 'cans', category: 'ingredient' },
  pack: { id: 'pack', abbr: 'pack', singular: 'pack', plural: 'packs', category: 'ingredient' },
};

export function isWeightUnit(unit: UnitId): unit is WeightUnit {
  return (WEIGHT_UNITS as readonly string[]).includes(unit);
}
