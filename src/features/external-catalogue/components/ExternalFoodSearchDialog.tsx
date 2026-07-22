import { useState, useEffect, useMemo } from 'react';
import { useFoodSearch, useFoodDetails } from '../hooks';
import type { ExternalFoodSearchResult, ExternalFoodDetails } from '../types';
import type { StoredIngredient } from '@/features/ingredients/schemas/ingredient.schema';
import { INGREDIENT_UNITS } from '@/shared/units/types';
import { formatNutrient } from '@/shared/utils/format';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Search, AlertTriangle, ChevronLeft, Database, Check, X } from 'lucide-react';
import { useImportedIngredientLookup } from '@/features/ingredients/hooks/use-ingredients';
import type {
  ImportExternalIngredientConversionInput,
  ImportExternalIngredientInput,
  ImportExternalIngredientResult,
} from '@/features/ingredients/services/import-external-ingredient';

const CATEGORIES = ['Protein', 'Carbohydrate', 'Fat', 'Dairy', 'Vegetable', 'Fruit', 'Sauce', 'Other'];
const CATEGORY_IDS: Record<string, string> = {
  'Meats': 'Protein', 'Poultry': 'Protein', 'Seafood': 'Protein',
  'Legumes and Legume Products': 'Protein',
  'Cereal Grains and Pasta': 'Carbohydrate', 'Baked Foods': 'Carbohydrate',
  'Fats and Oils': 'Fat', 'Dairy and Egg Products': 'Dairy',
  'Vegetables': 'Vegetable', 'Fruits and Fruit Juices': 'Fruit',
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredients: StoredIngredient[];
  onImport: (input: ImportExternalIngredientInput) => Promise<ImportExternalIngredientResult>;
  onOpenIngredient: (ingredient: StoredIngredient) => void;
}

export function ExternalFoodSearchDialog({ open, onOpenChange, ingredients, onImport, onOpenIngredient }: Props) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedQuery(query); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: pageData, isLoading, error } = useFoodSearch(debouncedQuery, page);
  const { data: details, isLoading: detailsLoading } = useFoodDetails('usda', selectedId || '');
  const { data: importedIngredient } = useImportedIngredientLookup('usda', selectedId || '');

  const importedByExternalId = useMemo(() => {
    const map = new Map<string, StoredIngredient>();
    for (const ingredient of ingredients) {
      if ((ingredient.source === 'usda' || ingredient.source === 'open-food-facts') && ingredient.externalSourceId) {
        map.set(`${ingredient.source}:${ingredient.externalSourceId}`, ingredient);
      }
    }
    return map;
  }, [ingredients]);

  const handleLoadMore = () => setPage((p) => p + 1);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setQuery('');
      setDebouncedQuery('');
      setPage(1);
      setSelectedId(null);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            {selectedId ? (details?.name || 'Import Food') : 'Import Food'}
          </DialogTitle>
          <DialogDescription>
            {selectedId ? 'Review and confirm before importing.' : 'Search USDA FoodData Central.'}
          </DialogDescription>
        </DialogHeader>

        {selectedId ? (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to results
            </Button>

            {detailsLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {details && (
              <ImportForm
                details={details}
                importedIngredient={importedIngredient ?? importedByExternalId.get(`usda:${details.externalId}`) ?? null}
                onOpenIngredient={onOpenIngredient}
                onSave={async (name, values, category, conversions) => {
                  const result = await onImport({
                    name,
                    caloriesPer100g: values.caloriesPer100g,
                    proteinPer100g: values.proteinPer100g,
                    carbsPer100g: values.carbsPer100g,
                    fatPer100g: values.fatPer100g,
                    category,
                    provider: 'usda',
                    externalId: details.externalId,
                    externalSourceName: details.name,
                    approvedConversions: conversions,
                  });
                  if (result.status === 'created') {
                    onOpenChange(false);
                  }
                  return result;
                }}
              />
            )}
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search USDA foods..." className="pl-9" autoFocus />
            </div>
            {isLoading && <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">{error.message?.includes('rate_limited') ? 'USDA API rate limit reached. Try again later.' : 'Search failed. Try again.'}</p>
              </div>
            )}
            {pageData && pageData.items.length === 0 && debouncedQuery.length >= 2 && (
              <div className="rounded-lg border border-dashed p-8 text-center"><p className="text-sm text-muted-foreground">No results found for "{debouncedQuery}".</p></div>
            )}
            {pageData && pageData.items.length > 0 && (
              <div className="max-h-[50vh] overflow-y-auto overflow-x-auto">
                <div className="space-y-1.5 min-w-[420px]">
                  {pageData.items.map((item) => (
                    <ResultRow
                      key={item.externalId}
                      item={item}
                      alreadyImported={importedByExternalId.has(`usda:${item.externalId}`)}
                      onClick={() => setSelectedId(item.externalId)}
                    />
                  ))}
                  {pageData.totalPages > page && (
                    <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={handleLoadMore} disabled={isLoading}>
                      Load more ({pageData.totalHits - page * 20} remaining)
                    </Button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ImportForm({
  details, importedIngredient, onOpenIngredient, onSave,
}: {
  details: ExternalFoodDetails;
  importedIngredient: StoredIngredient | null;
  onOpenIngredient: (ingredient: StoredIngredient) => void;
  onSave: (name: string, values: { caloriesPer100g: number; proteinPer100g: number; carbsPer100g: number; fatPer100g: number }, category: string, conversions: ImportExternalIngredientConversionInput[]) => Promise<ImportExternalIngredientResult>;
}) {
  const nonWeightUnits = useMemo(() =>
    details.servingOptions.filter((s) => s.unit && INGREDIENT_UNITS.includes(s.unit as typeof INGREDIENT_UNITS[number])),
  [details]);

  const [name, setName] = useState(details.name);
  const [caloriesPer100g, setCaloriesPer100g] = useState(String(details.caloriesPer100g ?? 0));
  const [proteinPer100g, setProteinPer100g] = useState(String(details.proteinPer100g ?? 0));
  const [carbsPer100g, setCarbsPer100g] = useState(String(details.carbohydratesPer100g ?? 0));
  const [fatPer100g, setFatPer100g] = useState(String(details.fatPer100g ?? 0));
  const [category, setCategory] = useState(CATEGORY_IDS[details.category || ''] || 'none');
  const [acceptedMap, setAcceptedMap] = useState<Record<number, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<{ tone: 'error' | 'info'; message: string } | null>(null);

  const handleSave = async () => {
    setStatus(null);
    const accepted: ImportExternalIngredientConversionInput[] = nonWeightUnits
      .filter((_, i) => acceptedMap[i])
      .map((s) => ({
        unit: s.unit as typeof INGREDIENT_UNITS[number],
        label: s.label,
        gramsPerUnit: Math.round(s.gramsPerUnit * 10) / 10,
        isDefault: false,
        sourceType: 'usda' as const,
        externalSourceId: details.externalId,
      }));

    setSubmitting(true);
    try {
      const result = await onSave(name.trim(), {
        caloriesPer100g: Number(caloriesPer100g) || 0,
        proteinPer100g: Number(proteinPer100g) || 0,
        carbsPer100g: Number(carbsPer100g) || 0,
        fatPer100g: Number(fatPer100g) || 0,
      }, category === 'none' ? '' : category, accepted);

      if (result.status === 'duplicate') {
        setStatus({ tone: 'info', message: 'This food is already imported in your catalogue.' });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import ingredient.';
      setStatus({ tone: 'error', message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {status && (
        <div
          aria-live="polite"
          className={`rounded-lg border p-3 text-sm ${status.tone === 'error' ? 'border-destructive/30 bg-destructive/5 text-destructive' : 'border-border bg-muted/40 text-foreground'}`}
        >
          {status.message}
          {status.tone === 'info' && importedIngredient && (
            <div className="mt-2">
              <Button size="sm" variant="outline" onClick={() => onOpenIngredient(importedIngredient)}>
                Open existing ingredient
              </Button>
            </div>
          )}
        </div>
      )}

      {importedIngredient && (
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <p className="text-sm font-medium">Already imported</p>
          <p className="text-[11px] text-muted-foreground">This USDA food is already saved in your catalogue as your own editable copy.</p>
          <Button size="sm" variant="outline" onClick={() => onOpenIngredient(importedIngredient)}>
            Open existing ingredient
          </Button>
        </div>
      )}

      <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-[10px]">USDA</Badge>
        </div>
        <p className="text-[11px] text-muted-foreground">Imported from USDA. Saved as your own editable copy.</p>
      </div>

      <div>
        <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1.5" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger><SelectValue placeholder="Select category..." /></SelectTrigger>
          <SelectContent position="popper" sideOffset={4}>
            <SelectItem value="none">Uncategorised</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Nutrition (per 100g)</Label>
        <div className="grid grid-cols-2 gap-2">
          <NutritionInput label="Calories" value={caloriesPer100g} onChange={setCaloriesPer100g} unit="kcal" />
          <NutritionInput label="Protein" value={proteinPer100g} onChange={setProteinPer100g} unit="g" />
          <NutritionInput label="Carbs" value={carbsPer100g} onChange={setCarbsPer100g} unit="g" />
          <NutritionInput label="Fat" value={fatPer100g} onChange={setFatPer100g} unit="g" />
        </div>
      </div>

      {details.servingOptions.length > 0 && (
        <>
          <Separator />
          <div>
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Serving Options</Label>
            <div className="space-y-1 mt-2">
              {details.servingOptions.map((s, i) => (
                <div key={i} className="rounded-md bg-muted/50 p-2">
                  <span className="font-medium text-xs">{s.label}</span>
                  <span className="text-[10px] text-muted-foreground block">{s.sourceDescription}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {nonWeightUnits.length > 0 && (
        <>
          <Separator />
          <div>
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Serving Conversions</Label>
            <p className="text-[10px] text-muted-foreground mb-2">Select conversions to save with this ingredient.</p>
            {nonWeightUnits.map((s, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg border p-2 mb-1">
                <Button
                  variant={acceptedMap[i] ? 'default' : 'outline'}
                  size="icon"
                  className="h-6 w-6 shrink-0 mt-1"
                  onClick={() => setAcceptedMap((m) => ({ ...m, [i]: !m[i] }))}
                >
                  {acceptedMap[i] ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                </Button>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium">{s.label}</span>
                  <span className="text-[10px] text-muted-foreground block">{Math.round(s.gramsPerUnit * 10) / 10}g per {s.label.split(' ').pop()}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {details.sourceUrl && (
        <p className="text-[10px] text-muted-foreground">
          Source: <a href={details.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">USDA FoodData Central</a>
        </p>
      )}

      <Button className="w-full" onClick={handleSave} disabled={submitting || !!importedIngredient || !name.trim()}>
        {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
        <Database className="h-4 w-4 mr-1.5" />
        {importedIngredient ? 'Already imported' : 'Import to Catalogue'}
      </Button>
    </div>
  );
}

function ResultRow({ item, alreadyImported, onClick }: { item: ExternalFoodSearchResult; alreadyImported: boolean; onClick: () => void }) {
  return (
    <button className="w-full text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer" onClick={onClick}>
      <div className="flex items-start gap-2 w-full">
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="text-sm font-medium truncate">{item.name}</p>
          {item.brand && <p className="text-[11px] text-muted-foreground truncate">{item.brand}</p>}
          <div className="flex gap-1 mt-1">
            <Badge variant="secondary" className="text-[10px]">USDA</Badge>
            {alreadyImported && <Badge variant="outline" className="text-[10px]">Already imported</Badge>}
          </div>
        </div>
        <div className="text-right whitespace-nowrap shrink-0">
          {item.caloriesPer100g != null ? <span className="text-xs font-medium">{formatNutrient(item.caloriesPer100g)} kcal</span> : <span className="text-[10px] text-muted-foreground">— kcal</span>}
          <br />
          {item.proteinPer100g != null ? <span className="text-xs font-medium">{formatNutrient(item.proteinPer100g)}g P</span> : <span className="text-[10px] text-muted-foreground">— P</span>}
        </div>
      </div>
    </button>
  );
}

function NutritionInput({ label, value, onChange, unit }: { label: string; value: string; onChange: (value: string) => void; unit: string }) {
  return (
    <div className="rounded-md bg-muted/50 p-2">
      <Label className="block text-[10px] text-muted-foreground mb-1">{label} / 100g</Label>
      <Input type="number" min="0" step="0.1" value={value} onChange={(e) => onChange(e.target.value)} className="h-8 text-sm" />
      <span className="block text-[10px] text-muted-foreground mt-1">{unit}</span>
    </div>
  );
}
