import { useEffect, useMemo, useState } from 'react';
import type { StoredIngredient } from '@/features/ingredients/schemas/ingredient.schema';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import { AlertTriangle, Barcode, Database, Loader2, RotateCcw } from 'lucide-react';
import { BarcodeScanner } from './barcode-scanner';
import { useFoodByBarcode } from '@/features/external-catalogue/hooks';
import { UNIT_META, INGREDIENT_UNITS } from '@/shared/units/types';
import type { ImportExternalIngredientInput, ImportExternalIngredientResult } from '@/features/ingredients/services/import-external-ingredient';
import type { ExternalBarcodeFoodDetails } from '@/features/external-catalogue/types';
import { formatNutrient } from '@/shared/utils/format';
import { cn } from '@/shared/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredients: StoredIngredient[];
  onImport: (input: ImportExternalIngredientInput) => Promise<ImportExternalIngredientResult>;
  onOpenIngredient: (ingredient: StoredIngredient) => void;
  onOpenManual: (draft: StoredIngredient | null) => void;
}

type FlowStep = 'scan' | 'lookup' | 'review' | 'error';

function buildConversion(details: ExternalBarcodeFoodDetails, amount: string, unit: string) {
  const parsedAmount = Number(amount);
  if (!details.servingQuantityGrams || !Number.isFinite(parsedAmount) || parsedAmount <= 0) return [];
  if (!INGREDIENT_UNITS.includes(unit as typeof INGREDIENT_UNITS[number])) return [];

  const meta = UNIT_META[unit as keyof typeof UNIT_META];
  const label = `${parsedAmount} ${parsedAmount === 1 ? meta.singular : meta.plural}`;

  return [{
    unit: unit as typeof INGREDIENT_UNITS[number],
    label,
    gramsPerUnit: Math.round((details.servingQuantityGrams / parsedAmount) * 10) / 10,
    isDefault: false,
    sourceType: 'open-food-facts' as const,
    externalSourceId: details.barcode,
  }];
}

export function BarcodeImportDialog({ open, onOpenChange, ingredients, onImport, onOpenIngredient, onOpenManual }: Props) {
  const [step, setStep] = useState<FlowStep>('scan');
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const { data: details, lookupState, isPending, error } = useFoodByBarcode(scannedBarcode);

  const importedIngredient = useMemo(() => {
    if (!details) return null;
    return ingredients.find((ingredient) => ingredient.source === 'open-food-facts' && ingredient.externalSourceId === details.barcode) ?? null;
  }, [details, ingredients]);

  useEffect(() => {
    if (!open) {
      setStep('scan');
      setScannedBarcode('');
      setSubmitting(false);
      setStatusMessage(null);
    }
  }, [open]);

  useEffect(() => {
    if (!scannedBarcode) return;
    if (lookupState === 'looking_up') {
      setStep('lookup');
      setStatusMessage(null);
      return;
    }
    if (lookupState === 'found' || lookupState === 'incomplete') {
      setStep('review');
      return;
    }
    if (lookupState === 'not_found' || lookupState === 'rate_limited' || lookupState === 'unavailable') {
      setStep('error');
    }
  }, [lookupState, scannedBarcode]);

  const handleScanAgain = () => {
    setScannedBarcode('');
    setStatusMessage(null);
    setStep('scan');
  };

  const handleManual = () => {
    if (details) {
      onOpenManual({
        id: `manual-${Date.now()}`,
        name: details.name || '',
        caloriesPer100g: details.caloriesPer100g ?? 0,
        proteinPer100g: details.proteinPer100g ?? 0,
        carbsPer100g: details.carbohydratesPer100g ?? 0,
        fatPer100g: details.fatPer100g ?? 0,
        category: details.category ?? '',
        source: 'open-food-facts',
        externalSourceId: details.barcode,
        externalSourceName: details.name || null,
        importedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    } else {
      onOpenManual(null);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[100dvh] max-w-none translate-x-[-50%] translate-y-[-50%] rounded-none top-[50%] p-4 sm:h-auto sm:max-h-[90vh] sm:max-w-2xl sm:rounded-lg sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Barcode className="h-4 w-4" />Scan barcode</DialogTitle>
          <DialogDescription>
            Scan a packaged food barcode, review the product, then add your own editable ingredient copy.
          </DialogDescription>
        </DialogHeader>

        {step === 'scan' && (
          <BarcodeScanner
            isOpen={open && step === 'scan'}
            onDetected={(barcode) => {
              setScannedBarcode(barcode);
              setStep('lookup');
            }}
            onCancel={() => onOpenChange(false)}
          />
        )}

        {step === 'lookup' && (
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-xl border bg-card text-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <div>
              <p className="font-medium">Looking up barcode</p>
              <p className="text-sm text-muted-foreground">{scannedBarcode}</p>
            </div>
          </div>
        )}

        {step === 'review' && details && (
          <BarcodeReview
            details={details}
            importedIngredient={importedIngredient}
            submitting={submitting || isPending}
            statusMessage={statusMessage}
            onAdd={async (input) => {
              setSubmitting(true);
              setStatusMessage(null);
              try {
                const result = await onImport(input);
                if (result.status === 'duplicate') {
                  setStatusMessage('This barcode product is already in your catalogue.');
                } else {
                  onOpenChange(false);
                }
                return result;
              } catch (err) {
                setStatusMessage(err instanceof Error ? err.message : 'Failed to add ingredient.');
                throw err;
              } finally {
                setSubmitting(false);
              }
            }}
            onOpenIngredient={onOpenIngredient}
            onScanAgain={handleScanAgain}
            onEnterManually={handleManual}
            onCancel={() => onOpenChange(false)}
          />
        )}

        {step === 'error' && (
          <div className="space-y-4 rounded-xl border bg-card p-4">
            <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <p className="font-medium">Lookup failed</p>
                <p>{error instanceof Error ? error.message : lookupState === 'not_found' ? 'No product was found for that barcode.' : 'The barcode lookup is unavailable right now.'}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleScanAgain}><RotateCcw className="mr-1.5 h-4 w-4" />Scan again</Button>
              <Button variant="outline" onClick={handleManual}>Enter manually</Button>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function BarcodeReview({
  details,
  importedIngredient,
  submitting,
  statusMessage,
  onAdd,
  onOpenIngredient,
  onScanAgain,
  onEnterManually,
  onCancel,
}: {
  details: ExternalBarcodeFoodDetails;
  importedIngredient: StoredIngredient | null;
  submitting: boolean;
  statusMessage: string | null;
  onAdd: (input: ImportExternalIngredientInput) => Promise<ImportExternalIngredientResult>;
  onOpenIngredient: (ingredient: StoredIngredient) => void;
  onScanAgain: () => void;
  onEnterManually: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(details.name);
  const [caloriesPer100g, setCaloriesPer100g] = useState(String(details.caloriesPer100g ?? 0));
  const [proteinPer100g, setProteinPer100g] = useState(String(details.proteinPer100g ?? 0));
  const [carbsPer100g, setCarbsPer100g] = useState(String(details.carbohydratesPer100g ?? 0));
  const [fatPer100g, setFatPer100g] = useState(String(details.fatPer100g ?? 0));
  const [category, setCategory] = useState(details.category ?? '');
  const [mealAmount, setMealAmount] = useState('1');
  const [mealUnit, setMealUnit] = useState<'item' | typeof INGREDIENT_UNITS[number]>('item');

  useEffect(() => {
    setName(details.name);
    setCaloriesPer100g(String(details.caloriesPer100g ?? 0));
    setProteinPer100g(String(details.proteinPer100g ?? 0));
    setCarbsPer100g(String(details.carbohydratesPer100g ?? 0));
    setFatPer100g(String(details.fatPer100g ?? 0));
    setCategory(details.category ?? '');
  }, [details]);

  const incomplete = details.completenessStatus !== 'complete';

  const handleAdd = async () => {
    await onAdd({
      name: name.trim(),
      caloriesPer100g: Number(caloriesPer100g) || 0,
      proteinPer100g: Number(proteinPer100g) || 0,
      carbsPer100g: Number(carbsPer100g) || 0,
      fatPer100g: Number(fatPer100g) || 0,
      category,
      provider: 'open-food-facts',
      externalId: details.barcode,
      externalSourceName: details.name || details.brand || details.barcode,
      approvedConversions: buildConversion(details, mealAmount, mealUnit),
    });
  };

  return (
    <div className="space-y-4 overflow-y-auto">
      {statusMessage && (
        <div className={cn('rounded-lg border p-3 text-sm', importedIngredient ? 'border-border bg-muted/40 text-foreground' : 'border-destructive/30 bg-destructive/5 text-destructive')}>
          {statusMessage}
          {importedIngredient && (
            <div className="mt-2">
              <Button size="sm" variant="outline" onClick={() => onOpenIngredient(importedIngredient)}>Open existing ingredient</Button>
            </div>
          )}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
        <div className="overflow-hidden rounded-xl border bg-muted/20">
          {details.imageUrl ? (
            <img src={details.imageUrl} alt={details.name || details.barcode} className="h-full w-full object-cover" />
          ) : (
            <div className="flex aspect-square items-center justify-center text-xs text-muted-foreground">No image</div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Open Food Facts</Badge>
            <Badge variant="outline">{details.barcode}</Badge>
            {incomplete && <Badge variant="outline" className="border-yellow-500/40 text-yellow-700 dark:text-yellow-400">Incomplete data</Badge>}
          </div>

          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="block text-muted-foreground">Brand</span>
              <span className="font-medium">{details.brand || '—'}</span>
            </div>
            <div>
              <span className="block text-muted-foreground">Package</span>
              <span className="font-medium">{details.packageQuantityText || '—'}</span>
            </div>
            <div>
              <span className="block text-muted-foreground">Serving size</span>
              <span className="font-medium">{details.servingSizeText || '—'}</span>
            </div>
            <div>
              <span className="block text-muted-foreground">Source</span>
              <span className="font-medium">Open Food Facts</span>
            </div>
          </div>
        </div>
      </div>

      {incomplete && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-sm text-yellow-800 dark:text-yellow-300">
          This product has incomplete community-contributed data. Review the nutrition before adding it.
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Nutrition (per 100g)</Label>
        <div className="grid grid-cols-2 gap-2">
          <ReviewNutritionInput label="Calories" value={caloriesPer100g} onChange={setCaloriesPer100g} unit="kcal" />
          <ReviewNutritionInput label="Protein" value={proteinPer100g} onChange={setProteinPer100g} unit="g" />
          <ReviewNutritionInput label="Carbs" value={carbsPer100g} onChange={setCarbsPer100g} unit="g" />
          <ReviewNutritionInput label="Fat" value={fatPer100g} onChange={setFatPer100g} unit="g" />
        </div>
      </div>

      <div className="space-y-2 rounded-xl border bg-muted/20 p-4">
        <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Meal use</Label>
        <p className="text-xs text-muted-foreground">
          Optional: save a serving conversion for how this product is commonly added to meals.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Amount</Label>
            <Input type="number" min="0.1" step="0.1" value={mealAmount} onChange={(event) => setMealAmount(event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Unit</Label>
            <Select value={mealUnit} onValueChange={(value: typeof mealUnit) => setMealUnit(value)}>
              <SelectTrigger><span>{UNIT_META[mealUnit].abbr} - {UNIT_META[mealUnit].singular}</span></SelectTrigger>
              <SelectContent>
                {INGREDIENT_UNITS.map((unit) => (
                  <SelectItem key={unit} value={unit}>{UNIT_META[unit].abbr} - {UNIT_META[unit].singular}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {details.servingQuantityGrams != null
            ? `${formatNutrient(details.servingQuantityGrams)}g will be saved for ${mealAmount || '0'} ${UNIT_META[mealUnit].abbr}.`
            : 'Serving weight is unavailable, so no meal-use conversion will be saved.'}
        </p>
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant="outline" onClick={onEnterManually}>Enter manually</Button>
        <Button variant="outline" onClick={onScanAgain}><RotateCcw className="mr-1.5 h-4 w-4" />Scan again</Button>
        {importedIngredient ? (
          <Button onClick={() => onOpenIngredient(importedIngredient)}>Open existing</Button>
        ) : (
          <Button onClick={handleAdd} disabled={submitting || !name.trim()}>
            {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            <Database className="mr-1.5 h-4 w-4" />
            Add ingredient
          </Button>
        )}
      </div>
    </div>
  );
}

function ReviewNutritionInput({ label, value, onChange, unit }: { label: string; value: string; onChange: (value: string) => void; unit: string }) {
  return (
    <div className="rounded-md bg-muted/50 p-2">
      <Label className="mb-1 block text-[10px] text-muted-foreground">{label} / 100g</Label>
      <Input type="number" min="0" step="0.1" value={value} onChange={(event) => onChange(event.target.value)} className="h-8 text-sm" />
      <span className="mt-1 block text-[10px] text-muted-foreground">{unit}</span>
    </div>
  );
}
