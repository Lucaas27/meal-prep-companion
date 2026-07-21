import { recipeRepository } from '@/features/recipes/repositories/recipe.repository';
import { ingredientRepository } from '@/features/ingredients/repositories/ingredient.repository';
import { dryToCookedRepository } from '@/features/dry-to-cooked/repositories/dry-to-cooked.repository';

export function exportBackup(): void {
  const data = {
    application: 'meal-prep-companion',
    exportedAt: new Date().toISOString(),
    formatVersion: 1,
    data: {
      recipes: recipeRepository.getAll(),
      ingredients: ingredientRepository.getAll(),
      dryToCookedCalculations: dryToCookedRepository.getAll(),
    },
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `meal-prep-companion-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
