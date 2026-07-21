import type { Recipe } from '../schemas/recipe.schema';
import { recipesArraySchema } from '../schemas/recipe.schema';
import { storageKeys } from '@/shared/constants/storage-keys';

export const recipeRepository = {
  getAll(): Recipe[] {
    try {
      const raw = localStorage.getItem(storageKeys.recipes);
      if (!raw) return [];
      return recipesArraySchema.parse(JSON.parse(raw));
    } catch (err) {
      console.error('Failed to load recipes from storage:', err);
      return [];
    }
  },

  getById(id: string): Recipe | undefined {
    return this.getAll().find((r) => r.id === id);
  },

  save(recipe: Recipe): void {
    const recipes = this.getAll();
    const idx = recipes.findIndex((r) => r.id === recipe.id);
    if (idx >= 0) {
      recipes[idx] = recipe;
    } else {
      recipes.push(recipe);
    }
    localStorage.setItem(storageKeys.recipes, JSON.stringify(recipes));
  },

  delete(id: string): void {
    const recipes = this.getAll().filter((r) => r.id !== id);
    localStorage.setItem(storageKeys.recipes, JSON.stringify(recipes));
  },

  duplicate(recipe: Recipe, newId: string, newName: string, newCreatedAt: number): void {
    const dup: Recipe = {
      ...recipe,
      id: newId,
      name: newName,
      createdAt: newCreatedAt,
      ingredients: recipe.ingredients.map((ing) => ({ ...ing })),
    };
    const recipes = this.getAll();
    recipes.push(dup);
    localStorage.setItem(storageKeys.recipes, JSON.stringify(recipes));
  },

  clear(): void {
    localStorage.removeItem(storageKeys.recipes);
  },
};
