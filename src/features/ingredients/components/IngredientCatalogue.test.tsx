import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import IngredientCatalogue from './IngredientCatalogue';

vi.mock('@/features/recipes/hooks', () => ({
  useRecipes: () => ({ data: [] }),
}));

vi.mock('../hooks/use-ingredient-mutations', () => ({
  useImportExternalIngredient: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('@/features/external-catalogue/components/ExternalFoodSearchDialog', () => ({
  ExternalFoodSearchDialog: () => null,
}));

vi.mock('@/shared/components/ConfirmDialog', () => ({
  useConfirm: () => ({ confirm: vi.fn(), dialog: null }),
}));

describe('IngredientCatalogue', () => {
  it('shows an imported source badge and no badge for manual ingredients', () => {
    render(
      <TooltipProvider>
        <IngredientCatalogue
          ingredients={[
            {
              id: 'ing-1',
              name: 'Chicken Breast',
              caloriesPer100g: 165,
              proteinPer100g: 31,
              carbsPer100g: 0,
              fatPer100g: 3.6,
              category: 'Protein',
              source: 'usda',
              externalSourceId: '123',
              externalSourceName: 'Chicken Breast',
              importedAt: Date.now(),
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
            {
              id: 'ing-2',
              name: 'Olive Oil',
              caloriesPer100g: 884,
              proteinPer100g: 0,
              carbsPer100g: 0,
              fatPer100g: 100,
              category: 'Fat',
              source: 'custom',
              externalSourceId: null,
              externalSourceName: null,
              importedAt: null,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ]}
          onSave={vi.fn()}
          onDelete={vi.fn()}
        />
      </TooltipProvider>,
    );

    expect(screen.getByText(/imported from usda/i)).not.toBeNull();
    expect(screen.queryByText(/imported from custom/i)).toBeNull();
  });
});
