import { describe, it, expect } from 'vitest';
import { round1dp, normaliseName } from './format';
import { createZeroNutrition, multiplyNutrition, divideNutrition, addNutrition } from './nutrition';

describe('round1dp', () => {
  it('rounds to 1 decimal place', () => {
    expect(round1dp(3.14159)).toBe(3.1);
    expect(round1dp(2.789)).toBe(2.8);
    expect(round1dp(100)).toBe(100);
    expect(round1dp(0.05)).toBe(0.1);
  });
});

describe('normaliseName', () => {
  it('trims and lowercases', () => {
    expect(normaliseName(' Chicken Breast ')).toBe('chicken breast');
  });

  it('collapses repeated whitespace', () => {
    expect(normaliseName('Chicken  Breast')).toBe('chicken breast');
  });
});

describe('createZeroNutrition', () => {
  it('returns all zeros', () => {
    expect(createZeroNutrition()).toEqual({ calories: 0, protein: 0, carbohydrates: 0, fat: 0 });
  });
});

describe('multiplyNutrition', () => {
  it('multiplies all fields', () => {
    const result = multiplyNutrition({ calories: 100, protein: 10, carbohydrates: 20, fat: 5 }, 2.5);
    expect(result).toEqual({ calories: 250, protein: 25, carbohydrates: 50, fat: 12.5 });
  });
});

describe('divideNutrition', () => {
  it('divides all fields', () => {
    const result = divideNutrition({ calories: 500, protein: 50, carbohydrates: 100, fat: 25 }, 2);
    expect(result).toEqual({ calories: 250, protein: 25, carbohydrates: 50, fat: 12.5 });
  });

  it('returns null for zero divisor', () => {
    expect(divideNutrition(createZeroNutrition(), 0)).toBeNull();
  });
});

describe('addNutrition', () => {
  it('adds two nutrition objects', () => {
    const result = addNutrition(
      { calories: 100, protein: 10, carbohydrates: 20, fat: 5 },
      { calories: 200, protein: 20, carbohydrates: 40, fat: 10 },
    );
    expect(result).toEqual({ calories: 300, protein: 30, carbohydrates: 60, fat: 15 });
  });
});
