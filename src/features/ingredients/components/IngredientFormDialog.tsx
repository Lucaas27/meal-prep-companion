import { useState, useEffect } from 'react';
import type { StoredIngredient } from '../schemas/ingredient.schema';
import type { ExternalFoodDetails } from '@/features/external-catalogue/types';
import { makeId } from '@/shared/lib/ids';
import { ingredientRepository } from '../repositories/ingredient.repository';
import { useUnitConversions, useCreateUnitConversion, useUpdateUnitConversion, useDeleteUnitConversion } from '../conversions/use-unit-conversions';
import type { UnitConversion } from '../conversions/unit-conversion.schema';
import { INGREDIENT_UNITS, UNIT_META } from '@/shared/units/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Plus, Trash2, Pencil, Loader2 } from 'lucide-react';
import { formatNutrient, formatCalories } from '@/shared/utils/format';
import { useFoodDetails } from '@/features/external-catalogue/hooks';

const CATEGORIES = ['Protein', 'Carbohydrate', 'Fat', 'Dairy', 'Vegetable', 'Fruit', 'Sauce', 'Other'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredient: StoredIngredient | null;
  onSave: (ingredient: StoredIngredient) => void;
}

export function IngredientFormDialog({ open, onOpenChange, ingredient, onSave }: Props) {
  const isEditing = ingredient !== null;
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [category, setCategory] = useState('');
  const [nameError, setNameError] = useState('');

  const currentKey = ingredient?.id ?? 'new';

  const canSave = name.trim().length > 0;

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setName(ingredient?.name ?? '');
    setCalories(ingredient ? String(ingredient.caloriesPer100g) : '');
    setProtein(ingredient ? String(ingredient.proteinPer100g) : '');
    setCarbs(ingredient ? String(ingredient.carbsPer100g) : '');
    setFat(ingredient ? String(ingredient.fatPer100g) : '');
    setCategory(ingredient?.category || 'none');
    setNameError('');
  }, [currentKey]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSave = () => {
    const normalised = name.trim();
    if (!normalised) { setNameError('Enter an ingredient name.'); return; }
    if (ingredientRepository.existsByNormalisedName(normalised, ingredient?.id)) {
      setNameError('An ingredient with this name already exists.');
      return;
    }
    const isCustom = ingredient?.source === 'custom';
    onSave({
      id: ingredient?.id ?? makeId(),
      name: normalised,
      caloriesPer100g: isCustom ? (Number(calories) || 0) : (ingredient?.caloriesPer100g ?? 0),
      proteinPer100g: isCustom ? (Number(protein) || 0) : (ingredient?.proteinPer100g ?? 0),
      carbsPer100g: isCustom ? (Number(carbs) || 0) : (ingredient?.carbsPer100g ?? 0),
      fatPer100g: isCustom ? (Number(fat) || 0) : (ingredient?.fatPer100g ?? 0),
      category: category === 'none' ? '' : category,
      source: ingredient?.source ?? 'custom',
      externalSourceId: ingredient?.externalSourceId ?? null,
      externalSourceName: ingredient?.externalSourceName ?? null,
      importedAt: ingredient?.importedAt ?? null,
      createdAt: ingredient?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Ingredient' : 'Create Ingredient'}</DialogTitle>
          <DialogDescription>Nutrition values per 100g.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] px-0.5">
          <div className="space-y-4 pr-4">
            <div className="space-y-1.5">
              <Label htmlFor="ing-name" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Name</Label>
              <Input id="ing-name" value={name} onChange={(e) => { setName(e.target.value); setNameError(''); }} placeholder="Chicken Breast" />
              {nameError && <p className="text-xs text-destructive">{nameError}</p>}
            </div>

            {ingredient && ingredient.source !== 'custom' ? (
              <div>
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Nutrition (per 100g)</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-md bg-muted/50 p-2">
                    <span className="block text-sm font-semibold">{formatCalories(ingredient.caloriesPer100g)}</span>
                    <span className="block text-[10px] text-muted-foreground">Calories kcal</span>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2">
                    <span className="block text-sm font-semibold">{formatNutrient(ingredient.proteinPer100g)}</span>
                    <span className="block text-[10px] text-muted-foreground">Protein g</span>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2">
                    <span className="block text-sm font-semibold">{formatNutrient(ingredient.carbsPer100g)}</span>
                    <span className="block text-[10px] text-muted-foreground">Carbs g</span>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2">
                    <span className="block text-sm font-semibold">{formatNutrient(ingredient.fatPer100g)}</span>
                    <span className="block text-[10px] text-muted-foreground">Fat g</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ing-cal" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Calories / 100g</Label>
                  <Input id="ing-cal" type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="165" min="0" step="0.1" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ing-prot" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Protein / 100g</Label>
                  <Input id="ing-prot" type="number" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="31" min="0" step="0.1" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ing-carbs" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Carbs / 100g</Label>
                  <Input id="ing-carbs" type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="0" min="0" step="0.1" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ing-fat" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Fat / 100g</Label>
                  <Input id="ing-fat" type="number" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="0" min="0" step="0.1" />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="ing-cat" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="ing-cat"><SelectValue placeholder="Select category..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Uncategorised</SelectItem>
                  {CATEGORIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            {isEditing && ingredient && ingredient.source !== 'custom' && ingredient.externalSourceId && (
              <ServingOptionsSection provider={ingredient.source} externalId={ingredient.externalSourceId} />
            )}

            {isEditing && ingredient && (
              <ConversionSection ingredientId={ingredient.id} ingredientName={ingredient.name} />
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {isEditing ? 'Save Changes' : 'Create Ingredient'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConversionSection({ ingredientId, ingredientName }: { ingredientId: string; ingredientName: string }) {
  const { data: conversions = [] } = useUnitConversions(ingredientId);
  const createConv = useCreateUnitConversion();
  const updateConv = useUpdateUnitConversion();
  const deleteConv = useDeleteUnitConversion();

  const [unit, setUnit] = useState('tbsp');
  const [label, setLabel] = useState('');
  const [grams, setGrams] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  const handleAddOrUpdate = () => {
    if (!label.trim() || !grams.trim()) return;
    const gramsNum = Number(grams);
    if (gramsNum <= 0) return;

    const conv: UnitConversion = {
      id: editId ?? makeId(),
      ingredientId,
      unit: unit as UnitConversion['unit'],
      label: label.trim(),
      gramsPerUnit: gramsNum,
      isDefault: false,
      sourceType: 'manual',
      externalSourceId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const action = editId ? updateConv : createConv;
    action.mutate(conv, {
      onSuccess: () => {
        toast.success(editId ? 'Conversion updated!' : 'Conversion added!');
        setUnit('tbsp');
        setLabel('');
        setGrams('');
        setEditId(null);
      },
      onError: () => toast.error('Failed to save conversion.'),
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this conversion?')) {
      deleteConv.mutate(id, {
        onSuccess: () => toast.success('Conversion deleted!'),
        onError: () => toast.error('Cannot delete — this conversion may be in use by a recipe.'),
      });
    }
  };

  const handleSetDefault = (conv: UnitConversion) => {
    updateConv.mutate({ ...conv, isDefault: true });
  };

  return (
    <>
      <Separator />

      <div className="space-y-3">
        <div>
          <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Unit Conversions</Label>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Define how much one unit of this ingredient weighs, so you can use {""}{ingredientName}{""} in recipes by tablespoons, cups, slices etc. These conversions are specific to {""}{ingredientName}{""} — they do not apply to other ingredients.
          </p>
        </div>

        {conversions.map((conv) => (
          <div key={conv.id} className="flex items-center gap-2 rounded-lg border p-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium truncate">{conv.label}</span>
                <Badge variant="secondary" className="text-[10px] shrink-0">{UNIT_META[conv.unit]?.abbr || conv.unit}</Badge>
                {conv.isDefault && <Badge className="text-[10px] shrink-0">default</Badge>}
              </div>
              <span className="text-[11px] text-muted-foreground">{conv.gramsPerUnit}g per {conv.label}</span>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              {!conv.isDefault && (
                <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => handleSetDefault(conv)}>Default</Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditId(conv.id); setUnit(conv.unit); setLabel(conv.label); setGrams(String(conv.gramsPerUnit)); }}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(conv.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}

        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {editId ? 'Edit Conversion' : 'Add Conversion'}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Unit</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {INGREDIENT_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>{UNIT_META[u].abbr} — {UNIT_META[u].singular}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">Label</Label>
              <Input
                className="h-8 text-xs"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="1 tbsp"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-muted-foreground">g per unit</Label>
              <Input
                className="h-8 text-xs"
                type="number"
                value={grams}
                onChange={(e) => setGrams(e.target.value)}
                placeholder="13.5"
                min="0"
                step="0.1"
              />
            </div>
          </div>
          <div className="flex gap-1.5">
            <Button size="sm" className="h-7 text-xs" onClick={handleAddOrUpdate} disabled={!label.trim() || !grams.trim()}>
              <Plus className="h-3 w-3 mr-1" />
              {editId ? 'Update' : 'Add'}
            </Button>
            {editId && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setEditId(null); setUnit('tbsp'); setLabel(''); setGrams(''); }}>
                Cancel
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function ServingOptionsSection({ provider, externalId }: { provider: string; externalId: string }) {
  const { data: details, isLoading } = useFoodDetails(provider, externalId);

  if (isLoading) return <div className="flex items-center justify-center py-4"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>;
  if (!details?.servingOptions.length) return null;

  return (
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
  );
}
