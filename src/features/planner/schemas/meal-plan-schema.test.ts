import { describe, it, expect } from 'vitest';
import { mealPlanEntrySchema } from '../schemas/meal-plan.schema';

describe('mealPlanEntrySchema', () => {
  it('accepts valid entry', () => {
    const result = mealPlanEntrySchema.safeParse({
      id: 'e1', recipeId: 'r1', plannedDate: '2026-07-21', mealSlot: 'lunch',
      servings: 2, position: 0, createdAt: 1000,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid meal slot', () => {
    const result = mealPlanEntrySchema.safeParse({
      id: 'e1', recipeId: 'r1', plannedDate: '2026-07-21', mealSlot: 'brunch',
      servings: 2, position: 0, createdAt: 1000,
    });
    expect(result.success).toBe(false);
  });

  it('rejects zero servings', () => {
    const result = mealPlanEntrySchema.safeParse({
      id: 'e1', recipeId: 'r1', plannedDate: '2026-07-21', mealSlot: 'dinner',
      servings: 0, position: 0, createdAt: 1000,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative position', () => {
    const result = mealPlanEntrySchema.safeParse({
      id: 'e1', recipeId: 'r1', plannedDate: '2026-07-21', mealSlot: 'snack',
      servings: 1, position: -1, createdAt: 1000,
    });
    expect(result.success).toBe(false);
  });

  it('applies defaults for notes and updatedAt', () => {
    const result = mealPlanEntrySchema.parse({
      id: 'e1', recipeId: 'r1', plannedDate: '2026-07-21', mealSlot: 'breakfast',
      servings: 1, position: 0, createdAt: 1000,
    });
    expect(result.notes).toBe('');
    expect(result.updatedAt).toBe(0);
  });
});
