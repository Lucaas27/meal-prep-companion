import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExternalFoodSearchDialog } from './ExternalFoodSearchDialog';
import { useFoodDetails, useFoodSearch } from '../hooks';
import { useImportedIngredientLookup } from '@/features/ingredients/hooks/use-ingredients';

vi.mock('../hooks', () => ({
  useFoodSearch: vi.fn(),
  useFoodDetails: vi.fn(),
}));

vi.mock('@/features/ingredients/hooks/use-ingredients', () => ({
  useImportedIngredientLookup: vi.fn(),
}));

const details = {
  provider: 'usda',
  externalId: '123',
  name: 'Chicken Breast',
  description: null,
  brand: null,
  dataType: 'Foundation',
  caloriesPer100g: 165,
  proteinPer100g: 31,
  carbohydratesPer100g: 0,
  fatPer100g: 3.6,
  category: 'Poultry',
  servingOptions: [],
  sourceUrl: null,
  retrievedAt: '2026-07-22T00:00:00Z',
};

beforeEach(() => {
  vi.mocked(useFoodSearch).mockReturnValue({
    data: { items: [details], totalHits: 1, currentPage: 1, totalPages: 1 },
    isLoading: false,
    error: null,
  } as never);

  vi.mocked(useFoodDetails).mockReturnValue({
    data: details,
    isLoading: false,
  } as never);

  vi.mocked(useImportedIngredientLookup).mockReturnValue({ data: null } as never);
});

describe('ExternalFoodSearchDialog', () => {
  it('closes after a successful import', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    const onImport = vi.fn().mockResolvedValue({
      status: 'created',
      ingredient: {
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
      conversions: [],
    });

    render(
      <ExternalFoodSearchDialog
        open
        onOpenChange={onOpenChange}
        ingredients={[]}
        onImport={onImport}
        onOpenIngredient={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /chicken breast/i }));
    await user.click(screen.getByRole('button', { name: /import to catalogue/i }));

    await waitFor(() => expect(onImport).toHaveBeenCalled());
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('shows duplicate recovery and opens the existing ingredient', async () => {
    const user = userEvent.setup();
    const onOpenIngredient = vi.fn();

    vi.mocked(useImportedIngredientLookup).mockReturnValue({
      data: {
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
    } as never);

    render(
      <ExternalFoodSearchDialog
        open
        onOpenChange={vi.fn()}
        ingredients={[]}
        onImport={vi.fn()}
        onOpenIngredient={onOpenIngredient}
      />,
    );

    await user.click(screen.getByRole('button', { name: /chicken breast/i }));
    expect((await screen.findAllByText(/already imported/i)).length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: /open existing ingredient/i }));
    expect(onOpenIngredient).toHaveBeenCalled();
  });

  it('keeps edited values visible after a failed import', async () => {
    const user = userEvent.setup();
    const onImport = vi.fn().mockRejectedValue(new Error('Import failed'));

    render(
      <ExternalFoodSearchDialog
        open
        onOpenChange={vi.fn()}
        ingredients={[]}
        onImport={onImport}
        onOpenIngredient={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /chicken breast/i }));
    const nameInput = screen.getAllByRole('textbox')[0];
    await user.clear(nameInput);
    await user.type(nameInput, 'Edited Chicken');
    await user.click(screen.getByRole('button', { name: /import to catalogue/i }));

    expect(await screen.findByText(/import failed/i)).not.toBeNull();
    expect(screen.getByDisplayValue('Edited Chicken')).not.toBeNull();
  });

  it('marks already imported search results', () => {
    render(
      <ExternalFoodSearchDialog
        open
        onOpenChange={vi.fn()}
        ingredients={[{
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
        }]}
        onImport={vi.fn()}
        onOpenIngredient={vi.fn()}
      />,
    );

    expect(screen.getAllByText(/already imported/i).length).toBeGreaterThan(0);
  });
});
