import type { WeightUnit } from './types';

const WEIGHT_TO_GRAMS: Record<WeightUnit, number> = {
  mg: 0.001,
  g: 1,
  kg: 1000,
  oz: 28.349523125,
  lb: 453.59237,
};

export interface QuantityToGramsResult {
  status: 'available' | 'unavailable';
  grams?: number;
  reason?: 'missing-unit-conversion' | 'invalid-quantity';
}

export function convertWeightToGrams(quantity: number, unit: WeightUnit): QuantityToGramsResult {
  if (!Number.isFinite(quantity) || quantity < 0) {
    return { status: 'unavailable', reason: 'invalid-quantity' };
  }

  if (quantity === 0) {
    return { status: 'available', grams: 0 };
  }

  const factor = WEIGHT_TO_GRAMS[unit];
  const grams = quantity * factor;
  if (!Number.isFinite(grams)) {
    return { status: 'unavailable', reason: 'invalid-quantity' };
  }
  return { status: 'available', grams };
}

export function convertIngredientUnitToGrams(
  quantity?: number,
  gramsPerUnit?: number,
): QuantityToGramsResult {
  if (quantity === undefined || !Number.isFinite(quantity) || quantity < 0) {
    return { status: 'unavailable', reason: 'invalid-quantity' };
  }

  if (!gramsPerUnit || gramsPerUnit <= 0 || !Number.isFinite(gramsPerUnit)) {
    return { status: 'unavailable', reason: 'missing-unit-conversion' };
  }

  if (quantity === 0) {
    return { status: 'available', grams: 0 };
  }

  const grams = quantity * gramsPerUnit;
  if (!Number.isFinite(grams)) {
    return { status: 'unavailable', reason: 'invalid-quantity' };
  }
  return { status: 'available', grams };
}
