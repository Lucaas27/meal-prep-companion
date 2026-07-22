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
import { makeId } from '@/shared/lib/ids';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredients: StoredIngredient[];
  onImport: (input: ImportExternalIngredientInput) => Promise<ImportExternalIngredientResult>;
  onOpenIngredient: (ingredient: StoredIngredient) => void;
  onSaveIngredient: (ingredient: StoredIngredient) => void;
}

type FlowStep = 'scan' | 'lookup' | 'review' | 'manual' | 'error';
const BARCODE_LOOKUP_COOLDOWN_MS = 3000;

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

export function BarcodeImportDialog({ open, onOpenChange, ingredients, onImport, onOpenIngredient, onSaveIngredient }: Props) {
  const [step, setStep] = useState<FlowStep>('scan');
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [cooldownMessage, setCooldownMessage] = useState<string | null>(null);
  const [lastScannedBarcode, setLastScannedBarcode] = useState<string | null>(null);
  const [lastScannedAt, setLastScannedAt] = useState(0);

  const { data: details, lookupState, isPending, error } = useFoodByBarcode(scannedBarcode);

  const importedIngredient = useMemo(() => {
    if (!details) return null;
    return ingredients.find((ingredient) => ingredient.source === 'open-food-facts' && ingredient.externalSourceId === details.barcode) ?? null;
  }, [details, ingredients]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) {
      setStep('scan');
      setScannedBarcode('');
      setSubmitting(false);
      setStatusMessage(null);
      setCooldownMessage(null);
      setLastScannedBarcode(null);
      setLastScannedAt(0);
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
    if (lookupState === 'not_found') {
      setStep('manual');
      return;
    }
    if (lookupState === 'rate_limited' || lookupState === 'unavailable') {
      setStep('error');
    }
  }, [lookupState, scannedBarcode]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleScanAgain = () => {
    setScannedBarcode('');
    setStatusMessage(null);
    setCooldownMessage(null);
    setStep('scan');
  };

  const handleManual = () => {
    setStatusMessage(null);
    setStep('manual');
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
          <div className="space-y-3">
            {cooldownMessage && (
              <div className="rounded-lg border border-muted-foreground/30 bg-muted/20 p-3 text-sm text-foreground" aria-live="polite">
                {cooldownMessage}
              </div>
            )}
            <BarcodeScanner
              isOpen={open && step === 'scan'}
              onDetected={(barcode) => {
                const now = Date.now();
                if (lastScannedBarcode === barcode && now - lastScannedAt < BARCODE_LOOKUP_COOLDOWN_MS) {
                  setCooldownMessage('That barcode was just scanned. Please wait a moment or scan a different product.');
                  return;
                }
                setCooldownMessage(null);
                setLastScannedBarcode(barcode);
                setLastScannedAt(now);
                setScannedBarcode(barcode);
                setStep('lookup');
              }}
              onCancel={() => onOpenChange(false)}
            />
          </div>
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
            manualMode={false}
            notFound={false}
            onEnterManually={handleManual}
            onCancel={() => onOpenChange(false)}
          />
        )}

        {step === 'manual' && (
          <BarcodeReview
            details={details ?? null}
            importedIngredient={importedIngredient}
            submitting={submitting || isPending}
            statusMessage={lookupState === 'not_found' ? `We couldn't find this product. You can add it manually.` : statusMessage}
            onAdd={async (input) => {
              setSubmitting(true);
              setStatusMessage(null);
              try {
                const ingredient: StoredIngredient = {
                  id: makeId(),
                  name: input.name,
                  caloriesPer100g: input.caloriesPer100g,
                  proteinPer100g: input.proteinPer100g,
                  carbsPer100g: input.carbsPer100g,
                  fatPer100g: input.fatPer100g,
                  category: input.category,
                  source: 'open-food-facts',
                  externalSourceId: input.externalId,
                  externalSourceName: input.externalSourceName,
                  importedAt: Date.now(),
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                };
                onSaveIngredient(ingredient);
                onOpenChange(false);
                return { status: 'created', ingredient, conversions: [] } as const;
              } finally {
                setSubmitting(false);
              }
            }}
            onOpenIngredient={onOpenIngredient}
            onScanAgain={handleScanAgain}
            manualMode
            notFound={lookupState === 'not_found'}
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
                <p>
                  {lookupState === 'rate_limited'
                    ? 'Open Food Facts is rate limited right now. Please wait and try again.'
                    : lookupState === 'unavailable'
                      ? 'The product lookup service is temporarily unavailable. You can try again or enter it manually.'
                      : error instanceof Error
                        ? error.message
                        : 'The barcode lookup is unavailable right now.'}
                </p>
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
  manualMode,
  notFound,
  onEnterManually,
  onCancel,
}: {
  details: ExternalBarcodeFoodDetails | null;
  importedIngredient: StoredIngredient | null;
  submitting: boolean;
  statusMessage: string | null;
  onAdd: (input: ImportExternalIngredientInput) => Promise<ImportExternalIngredientResult>;
  onOpenIngredient: (ingredient: StoredIngredient) => void;
  onScanAgain: () => void;
  manualMode: boolean;
  notFound: boolean;
  onEnterManually: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(details?.name ?? '');
  const [brand, setBrand] = useState(details?.brand ?? '');
  const [packageQuantityText, setPackageQuantityText] = useState(details?.packageQuantityText ?? '');
  const [servingSizeText, setServingSizeText] = useState(details?.servingSizeText ?? '');
  const [caloriesPer100g, setCaloriesPer100g] = useState(details?.caloriesPer100g != null ? String(details.caloriesPer100g) : '');
  const [proteinPer100g, setProteinPer100g] = useState(details?.proteinPer100g != null ? String(details.proteinPer100g) : '');
  const [carbsPer100g, setCarbsPer100g] = useState(details?.carbohydratesPer100g != null ? String(details.carbohydratesPer100g) : '');
  const [fatPer100g, setFatPer100g] = useState(details?.fatPer100g != null ? String(details.fatPer100g) : '');
  const [fibrePer100g, setFibrePer100g] = useState(details?.fibrePer100g != null ? String(details.fibrePer100g) : '');
  const [category, setCategory] = useState(details?.category ?? '');
  const [mealAmount, setMealAmount] = useState('1');
  const [mealUnit, setMealUnit] = useState<'item' | typeof INGREDIENT_UNITS[number]>('item');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setName(details?.name ?? '');
    setBrand(details?.brand ?? '');
    setPackageQuantityText(details?.packageQuantityText ?? '');
    setServingSizeText(details?.servingSizeText ?? '');
    setCaloriesPer100g(details?.caloriesPer100g != null ? String(details.caloriesPer100g) : '');
    setProteinPer100g(details?.proteinPer100g != null ? String(details.proteinPer100g) : '');
    setCarbsPer100g(details?.carbohydratesPer100g != null ? String(details.carbohydratesPer100g) : '');
    setFatPer100g(details?.fatPer100g != null ? String(details.fatPer100g) : '');
    setFibrePer100g(details?.fibrePer100g != null ? String(details.fibrePer100g) : '');
    setCategory(details?.category ?? '');
    setFieldErrors({});
  }, [details]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const incomplete = details ? details.completenessStatus !== 'complete' : true;
  const editedByUser = !!details && (
    name !== details.name ||
    caloriesPer100g !== (details.caloriesPer100g != null ? String(details.caloriesPer100g) : '') ||
    proteinPer100g !== (details.proteinPer100g != null ? String(details.proteinPer100g) : '') ||
    carbsPer100g !== (details.carbohydratesPer100g != null ? String(details.carbohydratesPer100g) : '') ||
    fatPer100g !== (details.fatPer100g != null ? String(details.fatPer100g) : '') ||
    fibrePer100g !== (details.fibrePer100g != null ? String(details.fibrePer100g) : '')
  );

  const validateNumberField = (value: string, label: string, required = true) => {
    if (!value.trim()) {
      return required ? `${label} is required.` : null;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return `${label} must be zero or greater.`;
    }
    return null;
  };

  const handleAdd = async () => {
    const nextErrors: Record<string, string> = {};
    if (!name.trim()) nextErrors.name = 'Product name is required.';
    const caloriesError = validateNumberField(caloriesPer100g, 'Calories');
    if (caloriesError) nextErrors.caloriesPer100g = caloriesError;
    const proteinError = validateNumberField(proteinPer100g, 'Protein');
    if (proteinError) nextErrors.proteinPer100g = proteinError;
    const carbsError = validateNumberField(carbsPer100g, 'Carbohydrates');
    if (carbsError) nextErrors.carbsPer100g = carbsError;
    const fatError = validateNumberField(fatPer100g, 'Fat');
    if (fatError) nextErrors.fatPer100g = fatError;
    const fibreError = validateNumberField(fibrePer100g, 'Fibre', false);
    if (fibreError) nextErrors.fibrePer100g = fibreError;

    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    await onAdd({
      name: name.trim(),
      caloriesPer100g: Number(caloriesPer100g),
      proteinPer100g: Number(proteinPer100g),
      carbsPer100g: Number(carbsPer100g),
      fatPer100g: Number(fatPer100g),
      category,
      provider: 'open-food-facts',
      externalId: details?.barcode ?? '',
      externalSourceName: name.trim() || brand.trim() || details?.barcode || '',
      approvedConversions: details ? buildConversion(details, mealAmount, mealUnit) : [],
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
          {details?.imageUrl ? (
            <img src={details.imageUrl} alt={details.name || details.barcode} className="h-full w-full object-cover" />
          ) : (
            <div className="flex aspect-square items-center justify-center text-xs text-muted-foreground">No image</div>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Open Food Facts</Badge>
            <Badge variant="outline">{details?.barcode ?? 'Scanned barcode'}</Badge>
            {incomplete && <Badge variant="outline" className="border-yellow-500/40 text-yellow-700 dark:text-yellow-400">Incomplete data</Badge>}
            {editedByUser && <Badge variant="outline" className="border-primary/30 text-primary">User-adjusted</Badge>}
          </div>

          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input value={name} onChange={(event) => setName(event.target.value)} />
            {fieldErrors.name && <p className="text-xs text-destructive">{fieldErrors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="block text-muted-foreground">Brand</span>
              {manualMode ? <Input value={brand} onChange={(event) => setBrand(event.target.value)} className="mt-1 h-8 text-sm" /> : <span className="font-medium">{brand || '—'}</span>}
            </div>
            <div>
              <span className="block text-muted-foreground">Package</span>
              {manualMode ? <Input value={packageQuantityText} onChange={(event) => setPackageQuantityText(event.target.value)} className="mt-1 h-8 text-sm" /> : <span className="font-medium">{packageQuantityText || '—'}</span>}
            </div>
            <div>
              <span className="block text-muted-foreground">Serving size</span>
              {manualMode ? <Input value={servingSizeText} onChange={(event) => setServingSizeText(event.target.value)} className="mt-1 h-8 text-sm" /> : <span className="font-medium">{servingSizeText || '—'}</span>}
            </div>
            <div>
              <span className="block text-muted-foreground">Source</span>
              <span className="font-medium">Open Food Facts</span>
            </div>
          </div>
        </div>
      </div>

      {notFound && (
        <div className="rounded-lg border border-muted-foreground/30 bg-muted/20 p-3 text-sm text-foreground">
          We couldn't find this product. You can add it manually.
        </div>
      )}

      {incomplete && !notFound && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 text-sm text-yellow-800 dark:text-yellow-300">
          This product has incomplete community-contributed data. Review and complete any missing nutrition values before adding it.
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Nutrition (per 100g)</Label>
        <p className="text-xs text-muted-foreground">Enter nutrition values per 100g, not per serving.</p>
        <div className="grid grid-cols-2 gap-2">
          <ReviewNutritionInput label="Calories" value={caloriesPer100g} onChange={setCaloriesPer100g} unit="kcal" error={fieldErrors.caloriesPer100g} missing={incomplete && !caloriesPer100g.trim()} />
          <ReviewNutritionInput label="Protein" value={proteinPer100g} onChange={setProteinPer100g} unit="g" error={fieldErrors.proteinPer100g} missing={incomplete && !proteinPer100g.trim()} />
          <ReviewNutritionInput label="Carbohydrates" value={carbsPer100g} onChange={setCarbsPer100g} unit="g" error={fieldErrors.carbsPer100g} missing={incomplete && !carbsPer100g.trim()} />
          <ReviewNutritionInput label="Fat" value={fatPer100g} onChange={setFatPer100g} unit="g" error={fieldErrors.fatPer100g} missing={incomplete && !fatPer100g.trim()} />
          <ReviewNutritionInput label="Fibre (optional)" value={fibrePer100g} onChange={setFibrePer100g} unit="g" error={fieldErrors.fibrePer100g} missing={false} />
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
          {details?.servingQuantityGrams != null
            ? `${formatNutrient(details.servingQuantityGrams)}g will be saved for ${mealAmount || '0'} ${UNIT_META[mealUnit].abbr}.`
            : 'Serving weight is unavailable, so no meal-use conversion will be saved.'}
        </p>
      </div>

      <div className="rounded-lg border bg-muted/20 p-3 text-xs text-muted-foreground">
        Product data and images are provided by Open Food Facts under their community data and image licences. Review imported values before saving.
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        {!manualMode && <Button variant="outline" onClick={onEnterManually}>Enter manually</Button>}
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

function ReviewNutritionInput({ label, value, onChange, unit, error, missing }: { label: string; value: string; onChange: (value: string) => void; unit: string; error?: string; missing?: boolean }) {
  return (
    <div className={cn('rounded-md bg-muted/50 p-2', missing && 'ring-1 ring-yellow-500/50')}>
      <Label className="mb-1 block text-[10px] text-muted-foreground">{label} / 100g</Label>
      <Input type="number" min="0" step="0.1" value={value} onChange={(event) => onChange(event.target.value)} className="h-8 text-sm" />
      <span className="mt-1 block text-[10px] text-muted-foreground">{unit}</span>
      {error && <p className="mt-1 text-[10px] text-destructive">{error}</p>}
    </div>
  );
}
