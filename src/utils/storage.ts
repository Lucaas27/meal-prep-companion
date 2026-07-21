import type { Recipe } from '../types';

const KEY = 'meal-prep-recipes';

export function loadRecipes(): Recipe[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Recipe[]) : [];
  } catch {
    return [];
  }
}

export function saveRecipes(recipes: Recipe[]): void {
  localStorage.setItem(KEY, JSON.stringify(recipes));
}
