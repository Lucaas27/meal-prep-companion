import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BarcodeImportDialog } from './barcode-import-dialog';
import { useFoodByBarcode } from '@/features/external-catalogue/hooks';

vi.mock('./barcode-scanner', () => ({
  BarcodeScanner: ({ onDetected, onCancel }: { onDetected: (barcode: string) => void; onCancel: () => void }) => (
    <div>
      <button onClick={() => onDetected('0036000291452')}>Mock detect</button>
      <button onClick={onCancel}>Mock cancel</button>
    </div>
  ),
}));

vi.mock('@/features/external-catalogue/hooks', () => ({
  useFoodByBarcode: vi.fn(),
}));

const barcodeDetails = {
  provider: 'open-food-facts' as const,
  externalId: '0036000291452',
  barcode: '0036000291452',
  name: 'Example Product',
  description: null,
  brand: 'Example Brand',
  dataType: 'packaged-food',
  caloriesPer100g: 250,
  proteinPer100g: 6,
  carbohydratesPer100g: 30,
  fatPer100g: 10,
  fibrePer100g: null,
  saltPer100g: 0.4,
  sodiumPer100g: null,
  category: 'Snack',
  servingOptions: [],
  sourceUrl: 'https://world.openfoodfacts.org/product/0036000291452',
  retrievedAt: '2026-07-22T00:00:00Z',
  imageUrl: 'https://example.com/image.jpg',
  packageQuantityText: '500 g',
  servingSizeText: '30 g',
  servingQuantityGrams: 30,
  completenessStatus: 'complete' as const,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useFoodByBarcode).mockReturnValue({
    data: null,
    lookupState: 'idle',
    isPending: false,
    error: null,
  } as never);
});

afterEach(() => {
  cleanup();
});

describe('BarcodeImportDialog', () => {
  it('supports a successful scan and add flow', async () => {
    const user = userEvent.setup();
    const onImport = vi.fn().mockResolvedValue({ status: 'created', ingredient: { id: 'ing-1', name: 'Example Product' }, conversions: [] });

    vi.mocked(useFoodByBarcode).mockReturnValue({
      data: barcodeDetails,
      lookupState: 'found',
      isPending: false,
      error: null,
    } as never);

    render(
      <BarcodeImportDialog
        open
        onOpenChange={vi.fn()}
        ingredients={[]}
        onImport={onImport}
        onOpenIngredient={vi.fn()}
        onSaveIngredient={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /mock detect/i }));
    await user.click(screen.getByRole('button', { name: /add ingredient/i }));

    await waitFor(() => expect(onImport).toHaveBeenCalledTimes(1));
    expect(onImport).toHaveBeenCalledWith(expect.objectContaining({
      provider: 'open-food-facts',
      externalId: '0036000291452',
      name: 'Example Product',
    }));
  });

  it('supports scan followed by cancellation', async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <BarcodeImportDialog
        open
        onOpenChange={onOpenChange}
        ingredients={[]}
        onImport={vi.fn()}
        onOpenIngredient={vi.fn()}
        onSaveIngredient={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /mock cancel/i }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows incomplete product warnings', async () => {
    const user = userEvent.setup();
    vi.mocked(useFoodByBarcode).mockReturnValue({
      data: { ...barcodeDetails, completenessStatus: 'missing_nutrition', caloriesPer100g: null },
      lookupState: 'incomplete',
      isPending: false,
      error: null,
    } as never);

    render(
      <BarcodeImportDialog
        open
        onOpenChange={vi.fn()}
        ingredients={[]}
        onImport={vi.fn()}
        onOpenIngredient={vi.fn()}
        onSaveIngredient={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /mock detect/i }));
    expect(await screen.findByText(/incomplete community-contributed data/i)).not.toBeNull();
  });

  it('requires a product name for invalid products before add', async () => {
    const user = userEvent.setup();
    vi.mocked(useFoodByBarcode).mockReturnValue({
      data: { ...barcodeDetails, name: '', completenessStatus: 'missing_name' },
      lookupState: 'incomplete',
      isPending: false,
      error: null,
    } as never);

    render(
      <BarcodeImportDialog
        open
        onOpenChange={vi.fn()}
        ingredients={[]}
        onImport={vi.fn()}
        onOpenIngredient={vi.fn()}
        onSaveIngredient={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /mock detect/i }));
    const addButton = await screen.findByRole('button', { name: /add ingredient/i });
    expect((addButton as HTMLButtonElement).disabled).toBe(true);
  });

  it('shows duplicate recovery using existing imported ingredients', async () => {
    const user = userEvent.setup();
    const onOpenIngredient = vi.fn();
    vi.mocked(useFoodByBarcode).mockReturnValue({
      data: barcodeDetails,
      lookupState: 'found',
      isPending: false,
      error: null,
    } as never);

    render(
      <BarcodeImportDialog
        open
        onOpenChange={vi.fn()}
        ingredients={[{
          id: 'ing-1',
          name: 'Example Product',
          caloriesPer100g: 250,
          proteinPer100g: 6,
          carbsPer100g: 30,
          fatPer100g: 10,
          category: 'Snack',
          source: 'open-food-facts',
          externalSourceId: '0036000291452',
          externalSourceName: 'Example Product',
          importedAt: Date.now(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        }]}
        onImport={vi.fn()}
        onOpenIngredient={onOpenIngredient}
        onSaveIngredient={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /mock detect/i }));
    await user.click(await screen.findByRole('button', { name: /open existing/i }));
    expect(onOpenIngredient).toHaveBeenCalled();
  });

  it('shows lookup failure actions', async () => {
    const user = userEvent.setup();
    const onSaveIngredient = vi.fn();
    vi.mocked(useFoodByBarcode).mockReturnValue({
      data: null,
      lookupState: 'not_found',
      isPending: false,
      error: new Error('Barcode product not found.'),
    } as never);

    render(
      <BarcodeImportDialog
        open
        onOpenChange={vi.fn()}
        ingredients={[]}
        onImport={vi.fn()}
        onOpenIngredient={vi.fn()}
        onSaveIngredient={onSaveIngredient}
      />,
    );

    await user.click(screen.getByRole('button', { name: /mock detect/i }));
    expect((await screen.findAllByText(/we couldn't find this product\. you can add it manually\./i)).length).toBeGreaterThan(0);
    const textboxes = screen.getAllByRole('textbox');
    const spinbuttons = screen.getAllByRole('spinbutton');
    await user.type(textboxes[0], 'Manual Product');
    await user.type(spinbuttons[0], '120');
    await user.type(spinbuttons[1], '8');
    await user.type(spinbuttons[2], '15');
    await user.type(spinbuttons[3], '4');
    await user.click(screen.getByRole('button', { name: /add ingredient/i }));
    expect(onSaveIngredient).toHaveBeenCalled();
  });
});
