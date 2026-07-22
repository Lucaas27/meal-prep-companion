import { useState, useEffect, useMemo } from 'react';
import { useFoodSearch, useFoodDetails } from '../hooks';
import type { ExternalFoodSearchResult, ExternalFoodDetails } from '../types';
import type { StoredIngredient } from '@/features/ingredients/schemas/ingredient.schema';
import type { UnitConversion } from '@/features/ingredients/conversions/unit-conversion.schema';
import { INGREDIENT_UNITS } from '@/shared/units/types';
import { makeId } from '@/shared/lib/ids';
import { formatNutrient, formatCalories } from '@/shared/utils/format';
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
import { toast } from 'sonner';

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
  onImport: (ingredient: StoredIngredient, conversions?: UnitConversion[]) => void;
}

export function ExternalFoodSearchDialog({ open, onOpenChange, onImport }: Props) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedQuery(query); setPage(1); }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: pageData, isLoading, error } = useFoodSearch(debouncedQuery, page);
  const { data: details, isLoading: detailsLoading } = useFoodDetails('usda', selectedId || '');

  const handleLoadMore = () => setPage((p) => p + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                submitting={submitting}
                onSave={async (name, values, category, conversions) => {
                  setSubmitting(true);
                  try {
                    onImport({
                      id: makeId(),
                      name,
                      caloriesPer100g: values.caloriesPer100g,
                      proteinPer100g: values.proteinPer100g,
                      carbsPer100g: values.carbsPer100g,
                      fatPer100g: values.fatPer100g,
                      category,
                      source: 'usda',
                      externalSourceId: details.externalId,
                      externalSourceName: details.name,
                      importedAt: Date.now(),
                      createdAt: Date.now(),
                      updatedAt: Date.now(),
                    }, conversions);
                    onOpenChange(false);
                  } catch {
                    toast.error('Failed to import ingredient.');
                  } finally {
                    setSubmitting(false);
                  }
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
                    <ResultRow key={item.externalId} item={item} onClick={() => setSelectedId(item.externalId)} />
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
  details, submitting, onSave,
}: {
  details: ExternalFoodDetails;
  submitting: boolean;
  onSave: (name: string, values: { caloriesPer100g: number; proteinPer100g: number; carbsPer100g: number; fatPer100g: number }, category: string, conversions: UnitConversion[]) => void;
}) {
  const nonWeightUnits = useMemo(() =>
    details.servingOptions.filter((s) => s.unit && INGREDIENT_UNITS.includes(s.unit as typeof INGREDIENT_UNITS[number])),
  [details]);

  const [category, setCategory] = useState(CATEGORY_IDS[details.category || ''] || 'none');
  const [acceptedMap, setAcceptedMap] = useState<Record<number, boolean>>({});

  const handleSave = () => {
    const accepted: UnitConversion[] = nonWeightUnits
      .filter((_, i) => acceptedMap[i])
      .map((s) => ({
        id: makeId(),
        ingredientId: '',
        unit: s.unit as typeof INGREDIENT_UNITS[number],
        label: s.label,
        gramsPerUnit: Math.round(s.gramsPerUnit * 10) / 10,
        isDefault: false,
        sourceType: 'usda' as const,
        externalSourceId: details.externalId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }));
    onSave(details.name, {
      caloriesPer100g: details.caloriesPer100g ?? 0,
      proteinPer100g: details.proteinPer100g ?? 0,
      carbsPer100g: details.carbohydratesPer100g ?? 0,
      fatPer100g: details.fatPer100g ?? 0,
    }, category === 'none' ? '' : category, accepted);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-[10px]">USDA</Badge>
        </div>
        <p className="text-[11px] text-muted-foreground">Imported data — review before saving.</p>
      </div>

      <div>
        <h3 className="font-semibold">{details.name}</h3>
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
          <NutritionItem label="Calories" value={details.caloriesPer100g} unit="kcal" special />
          <NutritionItem label="Protein" value={details.proteinPer100g} unit="g" />
          <NutritionItem label="Carbs" value={details.carbohydratesPer100g} unit="g" />
          <NutritionItem label="Fat" value={details.fatPer100g} unit="g" />
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

      <Button className="w-full" onClick={handleSave} disabled={submitting}>
        {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
        <Database className="h-4 w-4 mr-1.5" />
        Import to Catalogue
      </Button>
    </div>
  );
}

function ResultRow({ item, onClick }: { item: ExternalFoodSearchResult; onClick: () => void }) {
  return (
    <button className="w-full text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer" onClick={onClick}>
      <div className="flex items-start gap-2 w-full">
        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="text-sm font-medium truncate">{item.name}</p>
          {item.brand && <p className="text-[11px] text-muted-foreground truncate">{item.brand}</p>}
          <div className="flex gap-1 mt-1">
            <Badge variant="secondary" className="text-[10px]">USDA</Badge>
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

function NutritionItem({ label, value, unit, special }: { label: string; value: number | null; unit: string; special?: boolean }) {
  const display = value != null ? (special ? formatCalories(value) : formatNutrient(value)) : '—';
  return (
    <div className="rounded-md bg-muted/50 p-2">
      <span className="block text-sm font-semibold">{display}</span>
      <span className="block text-[10px] text-muted-foreground">{label} {value != null ? unit : ''}</span>
    </div>
  );
}


