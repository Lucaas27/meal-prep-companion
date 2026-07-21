export interface Nutrition {
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
}

export function createZeroNutrition(): Nutrition {
  return { calories: 0, protein: 0, carbohydrates: 0, fat: 0 };
}

export function multiplyNutrition(n: Nutrition, multiplier: number): Nutrition {
  return {
    calories: n.calories * multiplier,
    protein: n.protein * multiplier,
    carbohydrates: n.carbohydrates * multiplier,
    fat: n.fat * multiplier,
  };
}

export function divideNutrition(n: Nutrition, divisor: number): Nutrition | null {
  if (divisor === 0 || !Number.isFinite(divisor)) return null;
  return multiplyNutrition(n, 1 / divisor);
}

export function addNutrition(a: Nutrition, b: Nutrition): Nutrition {
  return {
    calories: a.calories + b.calories,
    protein: a.protein + b.protein,
    carbohydrates: a.carbohydrates + b.carbohydrates,
    fat: a.fat + b.fat,
  };
}
