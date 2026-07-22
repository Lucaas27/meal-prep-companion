import { calcIngredientCalories, calcIngredientProtein, calcIngredientCarbs, calcIngredientFat } from '@/features/recipes/utils/calculations';
import { round1dp, formatNutrient } from '@/shared/utils/format';
import type { Ingredient } from '@/features/recipes/schemas/recipe.schema';
import type { UnitConversion } from '@/features/ingredients/conversions/unit-conversion.schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2 } from 'lucide-react';
import { UNIT_META } from '@/shared/units/types';
import type { WeightUnit, UnitId } from '@/shared/units/types';
import { convertWeightToGrams, convertIngredientUnitToGrams } from '@/shared/units/conversion';

const WEIGHT_UNITS: WeightUnit[] = ['g', 'kg', 'mg', 'oz', 'lb'];

interface Props {
  ingredient: Ingredient;
  conversions?: UnitConversion[];
  onChange: (ingredient: Ingredient) => void;
  onDelete: () => void;
}

export default function IngredientRow({ ingredient, conversions = [], onChange, onDelete }: Props) {
  const handleChange = (field: keyof Ingredient, value: string) => {
    onChange({ ...ingredient, [field]: field === 'name' ? value : Number(value) });
  };

  const handleUnitChange = (value: string) => {
    if (value.startsWith('conv:')) {
      const convId = value.slice(5);
      const conv = conversions.find((c) => c.id === convId);
      if (conv) {
        onChange({ ...ingredient, unit: conv.unit, unitConversionId: convId });
        return;
      }
    }
    onChange({ ...ingredient, unit: value, unitConversionId: null });
  };

  const unitStr = ingredient.unit || 'g';
  const unitValue = ingredient.unitConversionId ? `conv:${ingredient.unitConversionId}` : unitStr;

  const weight = ingredient.weight || 0;
  const gramsLabel = getGramsLabel(weight, unitStr, ingredient.unitConversionId, conversions);

  const totalCal = weight > 0 ? round1dp(calcIngredientCalories(weight, ingredient.caloriesPer100g)) : 0;
  const totalProt = weight > 0 ? round1dp(calcIngredientProtein(weight, ingredient.proteinPer100g)) : 0;
  const totalCarbs = weight > 0 ? round1dp(calcIngredientCarbs(weight, ingredient.carbsPer100g)) : 0;
  const totalFat = weight > 0 ? round1dp(calcIngredientFat(weight, ingredient.fatPer100g)) : 0;

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="col-span-2 sm:col-span-1 space-y-1.5">
          <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Ingredient</Label>
          <Input value={ingredient.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Chicken breast" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Quantity</Label>
          <Input type="text" inputMode="decimal" value={ingredient.weight || ''} onChange={(e) => handleChange('weight', e.target.value)} placeholder="200" />
          {gramsLabel && <span className="text-[10px] text-muted-foreground">{gramsLabel}</span>}
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Unit</Label>
          <Select value={unitValue} onValueChange={handleUnitChange}>
            <SelectTrigger>
              <SelectValue>{getUnitLabel(unitStr, ingredient.unitConversionId, conversions)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {WEIGHT_UNITS.map((u) => (
                <SelectItem key={u} value={u}>{UNIT_META[u].abbr}</SelectItem>
              ))}
              {conversions.map((c) => (
                <SelectItem key={c.id} value={`conv:${c.id}`}>{c.label} ({UNIT_META[c.unit]?.abbr || c.unit})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cal / 100g</Label>
          <Input type="number" value={ingredient.caloriesPer100g || ''} onChange={(e) => handleChange('caloriesPer100g', e.target.value)} placeholder="165" min="0" step="0.1" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Prot / 100g</Label>
          <Input type="number" value={ingredient.proteinPer100g || ''} onChange={(e) => handleChange('proteinPer100g', e.target.value)} placeholder="31" min="0" step="0.1" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Carbs / 100g</Label>
          <Input type="number" value={ingredient.carbsPer100g || ''} onChange={(e) => handleChange('carbsPer100g', e.target.value)} placeholder="0" min="0" step="0.1" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Fat / 100g</Label>
          <Input type="number" value={ingredient.fatPer100g || ''} onChange={(e) => handleChange('fatPer100g', e.target.value)} placeholder="0" min="0" step="0.1" />
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-medium bg-background px-2 py-0.5 rounded-md border">{formatNutrient(totalCal)} kcal</span>
        <span className="text-xs font-medium bg-background px-2 py-0.5 rounded-md border">{formatNutrient(totalProt)}g P</span>
        <span className="text-xs font-medium bg-background px-2 py-0.5 rounded-md border">{formatNutrient(totalCarbs)}g C</span>
        <span className="text-xs font-medium bg-background px-2 py-0.5 rounded-md border">{formatNutrient(totalFat)}g F</span>
        <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onDelete} aria-label={`Remove ${ingredient.name || 'ingredient'}`}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

function getUnitLabel(unit: string, conversionId: string | null | undefined, conversions: UnitConversion[]): string {
  if (conversionId) {
    const conv = conversions.find((c) => c.id === conversionId);
    if (conv) return conv.label;
  }
  return UNIT_META[unit as UnitId]?.abbr || unit;
}

function getGramsLabel(weight: number, unit: string, conversionId: string | null | undefined, conversions: UnitConversion[]): string {
  if (!weight) return '';

  if (conversionId) {
    const conv = conversions.find((c) => c.id === conversionId);
    if (conv) {
      const result = convertIngredientUnitToGrams(weight, conv.gramsPerUnit);
      if (result.status === 'available') {
        return `(${round1dp(result.grams!)} g)`;
      }
      return '(conversion missing)';
    }
  }

  if (unit !== 'g') {
    const result = convertWeightToGrams(weight, unit as WeightUnit);
    if (result.status === 'available' && result.grams !== weight) {
      return `(${round1dp(result.grams!)} g)`;
    }
  }

  return '';
}
