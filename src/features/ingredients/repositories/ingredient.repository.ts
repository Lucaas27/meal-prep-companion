import type { StoredIngredient } from '../schemas/ingredient.schema';
import { storedIngredientsArraySchema } from '../schemas/ingredient.schema';
import { storageKeys } from '@/shared/constants/storage-keys';

export const ingredientRepository = {
  getAll(): StoredIngredient[] {
    try {
      const raw = localStorage.getItem(storageKeys.ingredients);
      if (!raw) return [];
      return storedIngredientsArraySchema.parse(JSON.parse(raw));
    } catch (err) {
      console.error('Failed to load ingredients from storage:', err);
      return [];
    }
  },

  getById(id: string): StoredIngredient | undefined {
    return this.getAll().find((i) => i.id === id);
  },

  save(ingredient: StoredIngredient): void {
    const ingredients = this.getAll();
    const idx = ingredients.findIndex((i) => i.id === ingredient.id);
    if (idx >= 0) {
      ingredients[idx] = ingredient;
    } else {
      ingredients.push(ingredient);
    }
    localStorage.setItem(storageKeys.ingredients, JSON.stringify(ingredients));
  },

  delete(id: string): void {
    const ingredients = this.getAll().filter((i) => i.id !== id);
    localStorage.setItem(storageKeys.ingredients, JSON.stringify(ingredients));
  },

  clear(): void {
    localStorage.removeItem(storageKeys.ingredients);
  },
};
