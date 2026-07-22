import { useState } from 'react';
import type { DryCookedInputs } from '../schemas/dry-cooked.schema';
import type { SavedCalculation } from '../schemas/saved-calculation.schema';
import {
  calcDryCookedTotals,
  calcDryCookedPer100g,
  calcDryCookedPerPortion,
  calcYieldRatio,
  calcCookedServingWeight,
  calcServingNutrition,
} from '../utils/calculations';
import { formatNutrient, formatCalories } from '@/shared/utils/format';
import { makeId } from '@/shared/lib/ids';
import {
  useDryToCookedCalculations,
  useSaveDryToCookedCalculation,
  useDeleteDryToCookedCalculation,
  useDuplicateDryToCookedCalculation,
} from '../hooks/use-dry-to-cooked';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { EditCalculationDialog } from './EditCalculationDialog';
import {
  Scale,
  Save,
  Pencil,
  Copy,
  Trash2,
  Undo2,
} from 'lucide-react';

const DEFAULTS: DryCookedInputs = {
  dryWeight: 200,
  dryCaloriesPer100g: 355,
  dryProteinPer100g: 8,
  dryCarbsPer100g: 77,
  dryFatPer100g: 1,
  nutritionBasis: 100,
  cookedWeight: 460,
  portions: 4,
};

export default function DryCookedCalculator() {
  const { data: saved = [] } = useDryToCookedCalculations();
  const saveMutation = useSaveDryToCookedCalculation();
  const deleteMutation = useDeleteDryToCookedCalculation();
  const duplicateMutation = useDuplicateDryToCookedCalculation();

  const [inputs, setInputs] = useState<DryCookedInputs>({ ...DEFAULTS });
  const [dryServing, setDryServing] = useState(0);
  const [saveName, setSaveName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDialogCalc, setEditDialogCalc] = useState<SavedCalculation | null>(null);

  const handleChange = (field: keyof DryCookedInputs, value: string) => {
    setInputs((prev) => ({ ...prev, [field]: Number(value) }));
  };

  const totals = calcDryCookedTotals(inputs);
  const per100g = inputs.cookedWeight > 0 ? calcDryCookedPer100g(totals, inputs.cookedWeight) : null;
  const perPortion =
    inputs.portions > 0 && inputs.cookedWeight > 0
      ? calcDryCookedPerPortion(totals, inputs.cookedWeight, inputs.portions)
      : null;
  const yieldRatio =
    inputs.dryWeight > 0 && inputs.cookedWeight > 0
      ? calcYieldRatio(inputs.dryWeight, inputs.cookedWeight)
      : 0;
  const cookedServing =
    dryServing > 0 && inputs.dryWeight > 0 && inputs.cookedWeight > 0
      ? calcCookedServingWeight(dryServing, inputs.dryWeight, inputs.cookedWeight)
      : 0;
  const servingNutrition =
    dryServing > 0 && inputs.dryWeight > 0
      ? calcServingNutrition(totals, dryServing, inputs.dryWeight)
      : null;

  const warnings: string[] = [];
  if (yieldRatio > 5) warnings.push('Cooked weight is more than 5× the dry weight. Verify your measurements.');
  if (yieldRatio > 0 && yieldRatio < 0.2) warnings.push('Cooked weight is less than 20% of the raw weight. Verify your measurements.');
  if (inputs.dryCaloriesPer100g === 0 && inputs.dryProteinPer100g === 0 && inputs.dryCarbsPer100g === 0 && inputs.dryFatPer100g === 0) {
    warnings.push('All nutrition values are zero. Check that this is intentional.');
  }

  const canSave = saveName.trim().length > 0 && inputs.dryWeight > 0 && inputs.cookedWeight > 0;

  const handleSave = () => {
    if (!canSave) return;
    const calc: SavedCalculation = {
      id: editingId ?? makeId(),
      name: saveName.trim(),
      dryWeight: inputs.dryWeight,
      cookedWeight: inputs.cookedWeight,
      dryCaloriesPer100g: inputs.dryCaloriesPer100g,
      dryProteinPer100g: inputs.dryProteinPer100g,
      dryCarbsPer100g: inputs.dryCarbsPer100g,
      dryFatPer100g: inputs.dryFatPer100g,
      nutritionBasis: inputs.nutritionBasis,
      portions: inputs.portions || 1,
      dryServingWeight: dryServing,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    saveMutation.mutate(calc, {
      onSuccess: () => {
        toast.success(editingId ? 'Calculation updated!' : 'Calculation saved!');
        setEditingId(null);
        setSaveName('');
      },
    });
  };

  const handleLoad = (calc: SavedCalculation) => {
    setInputs({
      dryWeight: calc.dryWeight,
      dryCaloriesPer100g: calc.dryCaloriesPer100g,
      dryProteinPer100g: calc.dryProteinPer100g,
      dryCarbsPer100g: calc.dryCarbsPer100g,
      dryFatPer100g: calc.dryFatPer100g,
      nutritionBasis: calc.nutritionBasis,
      cookedWeight: calc.cookedWeight,
      portions: calc.portions,
    });
    setDryServing(calc.dryServingWeight);
    setSaveName(calc.name);
    setEditingId(calc.id);
  };

  const handleReset = () => {
    if (inputs.dryWeight !== DEFAULTS.dryWeight || inputs.cookedWeight !== DEFAULTS.cookedWeight) {
      if (!confirm('Reset the calculator?')) return;
    }
    setInputs({ ...DEFAULTS });
    setDryServing(0);
    setSaveName('');
    setEditingId(null);
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Calculate cooked nutrition and serving weights from dry or raw ingredients.
      </p>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Calculator
          </CardTitle>
          <CardDescription>Enter dry food values and final cooked weight.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dc-dry-weight" className="text-[13px]">Dry weight (g)</Label>
              <Input id="dc-dry-weight" type="number" value={inputs.dryWeight || ''} onChange={(e) => handleChange('dryWeight', e.target.value)} min="0" step="1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dc-cooked" className="text-[13px]">Cooked weight (g)</Label>
              <Input id="dc-cooked" type="number" value={inputs.cookedWeight || ''} onChange={(e) => handleChange('cookedWeight', e.target.value)} min="0" step="1" />
            </div>
          </div>

          <Separator />

          <div className="flex items-end gap-2">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex-1">
              Nutrition per
            </Label>
            <div className="w-20 space-y-1.5">
              <Input
                type="number"
                value={inputs.nutritionBasis || ''}
                onChange={(e) => handleChange('nutritionBasis', e.target.value)}
                min="1"
                step="1"
                placeholder="100"
              />
            </div>
            <span className="text-sm text-muted-foreground pb-1.5">g</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dc-dry-cal" className="text-[13px]">Calories</Label>
              <Input id="dc-dry-cal" type="number" value={inputs.dryCaloriesPer100g || ''} onChange={(e) => handleChange('dryCaloriesPer100g', e.target.value)} min="0" step="0.1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dc-dry-prot" className="text-[13px]">Protein (g)</Label>
              <Input id="dc-dry-prot" type="number" value={inputs.dryProteinPer100g || ''} onChange={(e) => handleChange('dryProteinPer100g', e.target.value)} min="0" step="0.1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dc-dry-carbs" className="text-[13px]">Carbs (g)</Label>
              <Input id="dc-dry-carbs" type="number" value={inputs.dryCarbsPer100g || ''} onChange={(e) => handleChange('dryCarbsPer100g', e.target.value)} min="0" step="0.1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dc-dry-fat" className="text-[13px]">Fat (g)</Label>
              <Input id="dc-dry-fat" type="number" value={inputs.dryFatPer100g || ''} onChange={(e) => handleChange('dryFatPer100g', e.target.value)} min="0" step="0.1" />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="dc-portions" className="text-[13px]">Portions</Label>
              <Input id="dc-portions" type="number" value={inputs.portions || ''} onChange={(e) => handleChange('portions', e.target.value)} min="1" step="1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dc-dry-serving" className="text-[13px]">Dry serving (g)</Label>
              <Input id="dc-dry-serving" type="number" value={dryServing || ''} onChange={(e) => setDryServing(Number(e.target.value))} min="0" step="1" placeholder="Optional" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={handleReset} variant="outline" size="sm">
              <Undo2 className="h-4 w-4 mr-1.5" />
              Reset
            </Button>
          </div>
        </CardContent>
      </Card>

      {warnings.length > 0 && (
        <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/50 p-4">
          {warnings.map((w, i) => (
            <p key={i} className="text-sm text-yellow-700 dark:text-yellow-400">{w}</p>
          ))}
        </div>
      )}

      {(per100g || perPortion || cookedServing > 0) && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          {per100g && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Per 100g Cooked</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div><span className="block text-lg font-semibold">{formatCalories(per100g.caloriesPer100gCooked)}</span><span className="block text-[11px] text-muted-foreground mt-0.5">kcal</span></div>
                <div><span className="block text-lg font-semibold">{formatNutrient(per100g.proteinPer100gCooked)}g</span><span className="block text-[11px] text-muted-foreground mt-0.5">protein</span></div>
                <div><span className="block text-lg font-semibold">{formatNutrient(per100g.carbsPer100gCooked)}g</span><span className="block text-[11px] text-muted-foreground mt-0.5">carbs</span></div>
                <div><span className="block text-lg font-semibold">{formatNutrient(per100g.fatPer100gCooked)}g</span><span className="block text-[11px] text-muted-foreground mt-0.5">fat</span></div>
              </div>
            </div>
          )}

          <>
            <Separator />
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Batch Totals</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div><span className="block text-lg font-semibold">{formatCalories(totals.totalCalories)}</span><span className="block text-[11px] text-muted-foreground mt-0.5">kcal</span></div>
                <div><span className="block text-lg font-semibold">{formatNutrient(totals.totalProtein)}g</span><span className="block text-[11px] text-muted-foreground mt-0.5">protein</span></div>
                <div><span className="block text-lg font-semibold">{formatNutrient(totals.totalCarbs)}g</span><span className="block text-[11px] text-muted-foreground mt-0.5">carbs</span></div>
                <div><span className="block text-lg font-semibold">{formatNutrient(totals.totalFat)}g</span><span className="block text-[11px] text-muted-foreground mt-0.5">fat</span></div>
              </div>
            </div>
          </>

          {perPortion && (
            <>
              <Separator />
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Per Portion ({inputs.portions})</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-primary/5 rounded-lg p-3"><span className="block text-xl font-semibold text-primary">{formatCalories(perPortion.caloriesPerPortion)}</span><span className="block text-[11px] text-muted-foreground mt-0.5">kcal</span></div>
                  <div className="bg-primary/5 rounded-lg p-3"><span className="block text-xl font-semibold text-primary">{formatNutrient(perPortion.proteinPerPortion)}g</span><span className="block text-[11px] text-muted-foreground mt-0.5">protein</span></div>
                  <div className="rounded-lg p-3"><span className="block text-xl font-semibold">{formatNutrient(perPortion.carbsPerPortion)}g</span><span className="block text-[11px] text-muted-foreground mt-0.5">carbs</span></div>
                  <div className="rounded-lg p-3"><span className="block text-xl font-semibold">{formatNutrient(perPortion.fatPerPortion)}g</span><span className="block text-[11px] text-muted-foreground mt-0.5">fat</span></div>
                </div>
              </div>
            </>
          )}

          {cookedServing > 0 && servingNutrition && (
            <>
              <Separator />
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {dryServing}g Dry → {formatNutrient(cookedServing)}g Cooked
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div><span className="block text-lg font-semibold">{formatCalories(servingNutrition.totalCalories)}</span><span className="block text-[11px] text-muted-foreground mt-0.5">kcal</span></div>
                  <div><span className="block text-lg font-semibold">{formatNutrient(servingNutrition.totalProtein)}g</span><span className="block text-[11px] text-muted-foreground mt-0.5">protein</span></div>
                  <div><span className="block text-lg font-semibold">{formatNutrient(servingNutrition.totalCarbs)}g</span><span className="block text-[11px] text-muted-foreground mt-0.5">carbs</span></div>
                  <div><span className="block text-lg font-semibold">{formatNutrient(servingNutrition.totalFat)}g</span><span className="block text-[11px] text-muted-foreground mt-0.5">fat</span></div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
            <Save className="h-4 w-4" />
            Save Calculation
          </CardTitle>
          <CardDescription>Save this calculation to reuse later.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-end gap-2">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="save-name" className="text-[13px]">Name</Label>
            <Input id="save-name" value={saveName} onChange={(e) => setSaveName(e.target.value)} placeholder="Basmati Rice" />
          </div>
          <Button onClick={handleSave} disabled={!canSave} size="sm">
            {editingId ? 'Update' : 'Save'}
          </Button>
        </CardContent>
      </Card>

      {saved.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Saved ({saved.length})
          </h3>
          {saved.map((calc) => (
            <div key={calc.id} className="flex items-center gap-3 rounded-lg border p-3">
              <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleLoad(calc)}>
                <p className="font-medium text-sm truncate">{calc.name}</p>
                <p className="text-[11px] text-muted-foreground">
                  {calc.dryWeight}g dry → {calc.cookedWeight}g cooked
                  {calc.portions > 1 && ` · ${calc.portions} portions`}
                </p>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditDialogCalc(calc)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => duplicateMutation.mutate(calc)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => {
                    if (confirm(`Delete "${calc.name}"?`)) {
                      deleteMutation.mutate(calc.id);
                      if (editingId === calc.id) {
                        handleReset();
                      }
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-lg border bg-muted/30 p-4 text-[13px] text-muted-foreground leading-relaxed">
        <p>Cooking changes water content and weight, but not total calories or macros. This is an estimate — it does not account for drained fat, added oil, or food lost during preparation.</p>
      </div>

      <EditCalculationDialog
        key={editDialogCalc?.id ?? 'none'}
        open={editDialogCalc !== null}
        onOpenChange={(open) => { if (!open) setEditDialogCalc(null); }}
        calculation={editDialogCalc}
        onSave={(calc) => {
          saveMutation.mutate(calc, {
            onSuccess: () => toast.success('Calculation updated!'),
          });
        }}
      />
    </div>
  );
}
