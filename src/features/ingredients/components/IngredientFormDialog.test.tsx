import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IngredientFormDialog } from './IngredientFormDialog';

vi.mock('../conversions/use-unit-conversions', () => ({
  useUnitConversions: () => ({ data: [] }),
  useCreateUnitConversion: () => ({ mutate: vi.fn() }),
  useUpdateUnitConversion: () => ({ mutate: vi.fn() }),
  useDeleteUnitConversion: () => ({ mutate: vi.fn() }),
}));

vi.mock('@/features/external-catalogue/hooks', () => ({
  useFoodDetails: () => ({ data: null, isLoading: false }),
}));

vi.mock('@/shared/components/ConfirmDialog', () => ({
  useConfirm: () => ({ confirm: vi.fn(), dialog: null }),
}));

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock);

describe('IngredientFormDialog', () => {
  it('shows provenance and keeps it when an imported ingredient is edited', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(
      <IngredientFormDialog
        open
        onOpenChange={vi.fn()}
        ingredient={{
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
        }}
        onSave={onSave}
      />,
    );

    expect(screen.getByText(/saved as your own editable copy/i)).not.toBeNull();
    expect(screen.getByText('123')).not.toBeNull();

    const caloriesInput = screen.getByLabelText(/calories \/ 100g/i);
    await user.clear(caloriesInput);
    await user.type(caloriesInput, '170');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      caloriesPer100g: 170,
      source: 'usda',
      externalSourceId: '123',
      externalSourceName: 'Chicken Breast',
    }));
  });
});
