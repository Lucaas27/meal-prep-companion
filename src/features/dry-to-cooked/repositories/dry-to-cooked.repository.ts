import type { SavedCalculation } from '../schemas/saved-calculation.schema';
import { savedCalculationSchema } from '../schemas/saved-calculation.schema';
import { readValidatedCollection } from '@/shared/lib/storage';

const KEY = 'meal-prep-dry-cooked-v1';

export const dryToCookedRepository = {
  getAll(): SavedCalculation[] {
    try {
      return readValidatedCollection(
        localStorage.getItem(KEY),
        savedCalculationSchema,
        [],
      );
    } catch (err) {
      console.error('Failed to load dry-to-cooked calculations:', err);
      return [];
    }
  },

  save(calc: SavedCalculation): void {
    const all = this.getAll();
    const now = Date.now();
    const saved: SavedCalculation = { ...calc, updatedAt: now, createdAt: calc.createdAt || now };
    const idx = all.findIndex((c) => c.id === saved.id);
    if (idx >= 0) all[idx] = saved;
    else all.push(saved);
    localStorage.setItem(KEY, JSON.stringify(all));
  },

  delete(id: string): void {
    const all = this.getAll().filter((c) => c.id !== id);
    localStorage.setItem(KEY, JSON.stringify(all));
  },

  duplicate(source: SavedCalculation, newId: string): void {
    const dup: SavedCalculation = {
      ...source,
      id: newId,
      name: `${source.name} (copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    const all = this.getAll();
    all.push(dup);
    localStorage.setItem(KEY, JSON.stringify(all));
  },

  clear(): void {
    localStorage.removeItem(KEY);
  },
};
