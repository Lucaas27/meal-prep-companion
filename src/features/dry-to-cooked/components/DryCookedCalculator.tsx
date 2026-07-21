import { useState } from 'react';
import type { DryCookedInputs } from '../schemas/dry-cooked.schema';
import { calcDryCookedTotals, calcDryCookedPer100g, calcDryCookedPerPortion, round1dp } from '../utils/calculations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Scale } from 'lucide-react';

export default function DryCookedCalculator() {
  const [inputs, setInputs] = useState<DryCookedInputs>({
    dryWeight: 200,
    dryCaloriesPer100g: 355,
    dryProteinPer100g: 8,
    dryCarbsPer100g: 77,
    dryFatPer100g: 1,
    cookedWeight: 460,
    portions: 4,
  });

  const handleChange = (field: keyof DryCookedInputs, value: string) => {
    setInputs((prev) => ({ ...prev, [field]: Number(value) }));
  };

  const errors: string[] = [];
  if (inputs.dryWeight <= 0) errors.push('Dry weight must be greater than 0.');
  if (inputs.dryCaloriesPer100g <= 0) errors.push('Calories per 100g dry must be greater than 0.');
  if (inputs.dryProteinPer100g < 0) errors.push('Protein per 100g dry cannot be negative.');
  if (inputs.cookedWeight <= 0) errors.push('Cooked weight must be greater than 0.');
  if (inputs.portions <= 0) errors.push('Portions must be at least 1.');

  const hasError = errors.length > 0;
  const totals = hasError ? null : calcDryCookedTotals(inputs);
  const per100g = totals && inputs.cookedWeight > 0 ? calcDryCookedPer100g(totals, inputs.cookedWeight) : null;
  const perPortion = totals && inputs.portions > 0 ? calcDryCookedPerPortion(totals, inputs.cookedWeight, inputs.portions) : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Dry-to-Cooked</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Calculate nutritional values for foods that change weight when cooked.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
            <Scale className="h-4 w-4" />
            Inputs
          </CardTitle>
          <CardDescription>Enter the dry food values and final cooked weight.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="dc-dry-weight" className="text-[13px]">Dry weight (g)</Label>
            <Input id="dc-dry-weight" type="number" value={inputs.dryWeight || ''} onChange={(e) => handleChange('dryWeight', e.target.value)} min="0" step="1" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dc-dry-cal" className="text-[13px]">Calories / 100g dry</Label>
            <Input id="dc-dry-cal" type="number" value={inputs.dryCaloriesPer100g || ''} onChange={(e) => handleChange('dryCaloriesPer100g', e.target.value)} min="0" step="0.1" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dc-dry-prot" className="text-[13px]">Protein / 100g dry</Label>
            <Input id="dc-dry-prot" type="number" value={inputs.dryProteinPer100g || ''} onChange={(e) => handleChange('dryProteinPer100g', e.target.value)} min="0" step="0.1" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dc-dry-carbs" className="text-[13px]">Carbs / 100g dry</Label>
            <Input id="dc-dry-carbs" type="number" value={inputs.dryCarbsPer100g || ''} onChange={(e) => handleChange('dryCarbsPer100g', e.target.value)} min="0" step="0.1" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dc-dry-fat" className="text-[13px]">Fat / 100g dry</Label>
            <Input id="dc-dry-fat" type="number" value={inputs.dryFatPer100g || ''} onChange={(e) => handleChange('dryFatPer100g', e.target.value)} min="0" step="0.1" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dc-cooked" className="text-[13px]">Cooked batch weight (g)</Label>
            <Input id="dc-cooked" type="number" value={inputs.cookedWeight || ''} onChange={(e) => handleChange('cookedWeight', e.target.value)} min="0" step="1" />
          </div>
          <div className="space-y-1.5 col-span-2 sm:col-span-1">
            <Label htmlFor="dc-portions" className="text-[13px]">Portions</Label>
            <Input id="dc-portions" type="number" value={inputs.portions || ''} onChange={(e) => handleChange('portions', e.target.value)} min="1" step="1" />
          </div>
        </CardContent>
      </Card>

      {errors.length > 0 && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4" role="alert">
          {errors.map((e, i) => (
            <p key={i} className="text-sm text-destructive">{e}</p>
          ))}
        </div>
      )}

      {totals && (
        <div className="rounded-xl border bg-card p-5 space-y-4">
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Batch Totals
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div>
                <span className="block text-lg font-semibold tracking-tight">
                  {round1dp(totals.totalCalories)}
                </span>
                <span className="block text-[11px] text-muted-foreground mt-0.5">kcal</span>
              </div>
              <div>
                <span className="block text-lg font-semibold tracking-tight">
                  {round1dp(totals.totalProtein)}g
                </span>
                <span className="block text-[11px] text-muted-foreground mt-0.5">protein</span>
              </div>
              <div>
                <span className="block text-lg font-semibold tracking-tight">
                  {round1dp(totals.totalCarbs)}g
                </span>
                <span className="block text-[11px] text-muted-foreground mt-0.5">carbs</span>
              </div>
              <div>
                <span className="block text-lg font-semibold tracking-tight">
                  {round1dp(totals.totalFat)}g
                </span>
                <span className="block text-[11px] text-muted-foreground mt-0.5">fat</span>
              </div>
            </div>
          </div>

          {per100g && (
            <>
              <Separator />
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Per 100g Cooked
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div>
                    <span className="block text-lg font-semibold tracking-tight">
                      {round1dp(per100g.caloriesPer100gCooked)}
                    </span>
                    <span className="block text-[11px] text-muted-foreground mt-0.5">kcal</span>
                  </div>
                  <div>
                    <span className="block text-lg font-semibold tracking-tight">
                      {round1dp(per100g.proteinPer100gCooked)}g
                    </span>
                    <span className="block text-[11px] text-muted-foreground mt-0.5">protein</span>
                  </div>
                  <div>
                    <span className="block text-lg font-semibold tracking-tight">
                      {round1dp(per100g.carbsPer100gCooked)}g
                    </span>
                    <span className="block text-[11px] text-muted-foreground mt-0.5">carbs</span>
                  </div>
                  <div>
                    <span className="block text-lg font-semibold tracking-tight">
                      {round1dp(per100g.fatPer100gCooked)}g
                    </span>
                    <span className="block text-[11px] text-muted-foreground mt-0.5">fat</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {perPortion && (
            <>
              <Separator />
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Per Portion ({inputs.portions})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-primary/5 rounded-lg p-3">
                    <span className="block text-xl font-semibold tracking-tight text-primary">
                      {round1dp(perPortion.caloriesPerPortion)}
                    </span>
                    <span className="block text-[11px] text-muted-foreground mt-0.5">kcal</span>
                  </div>
                  <div className="bg-primary/5 rounded-lg p-3">
                    <span className="block text-xl font-semibold tracking-tight text-primary">
                      {round1dp(perPortion.proteinPerPortion)}g
                    </span>
                    <span className="block text-[11px] text-muted-foreground mt-0.5">protein</span>
                  </div>
                  <div className="rounded-lg p-3">
                    <span className="block text-xl font-semibold tracking-tight">
                      {round1dp(perPortion.carbsPerPortion)}g
                    </span>
                    <span className="block text-[11px] text-muted-foreground mt-0.5">carbs</span>
                  </div>
                  <div className="rounded-lg p-3">
                    <span className="block text-xl font-semibold tracking-tight">
                      {round1dp(perPortion.fatPerPortion)}g
                    </span>
                    <span className="block text-[11px] text-muted-foreground mt-0.5">fat</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div className="rounded-lg border bg-muted/30 p-4 text-[13px] text-muted-foreground leading-relaxed">
        <p>
          Cooking dry foods adds water weight. The dry food determines total calories and protein&mdash;cooking
          does not change these. The final cooked weight is only needed to work out values per 100g cooked
          and per portion.
        </p>
      </div>
    </div>
  );
}
