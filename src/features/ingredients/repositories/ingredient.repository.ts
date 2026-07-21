import type { StoredIngredient } from '../schemas/ingredient.schema';
import { storedIngredientsArraySchema } from '../schemas/ingredient.schema';
import { storageKeys } from '@/shared/constants/storage-keys';
import { STARTER_INGREDIENTS } from '../data/seed-data';

export const ingredientRepository = {
  getAll(): StoredIngredient[] {
    try {
      const raw = localStorage.getItem(storageKeys.ingredients);
      if (!raw) {
        localStorage.setItem(storageKeys.ingredients, JSON.stringify(STARTER_INGREDIENTS));
        return [...STARTER_INGREDIENTS];
      }
      return storedIngredientsArraySchema.parse(JSON.parse(raw));
    } catch (err) {
      console.error('Failed to load ingredients from storage:', err);
      localStorage.setItem(storageKeys.ingredients, JSON.stringify(STARTER_INGREDIENTS));
      return [...STARTER_INGREDIENTS];
    }
  },

  getById(id: string): StoredIngredient | undefined {
    return this.getAll().find((i) => i.id === id);
  },

  save(ingredient: StoredIngredient): void {
    const ingredients = this.getAll();
    const now = Date.now();
    const saved: StoredIngredient = {
      ...ingredient,
      updatedAt: now,
      createdAt: ingredient.createdAt || now,
    };
    const idx = ingredients.findIndex((i) => i.id === saved.id);
    if (idx >= 0) {
      ingredients[idx] = saved;
    } else {
      ingredients.push(saved);
    }
    localStorage.setItem(storageKeys.ingredients, JSON.stringify(ingredients));
  },

  delete(id: string): void {
    const ingredients = this.getAll().filter((i) => i.id !== id);
    localStorage.setItem(storageKeys.ingredients, JSON.stringify(ingredients));
  },

  existsByNormalisedName(name: string, excludeId?: string): boolean {
    const normalised = name.trim().toLowerCase().replace(/\s+/g, ' ');
    return this.getAll().some(
      (i) => i.name.trim().toLowerCase().replace(/\s+/g, ' ') === normalised && i.id !== excludeId,
    );
  },

  clear(): void {
    localStorage.removeItem(storageKeys.ingredients);
  },
};
