import { calcIngredientCalories, calcIngredientProtein, calcIngredientCarbs, calcIngredientFat } from '@/features/recipes/utils/calculations';
import { round1dp } from '@/shared/utils/format';
import type { Ingredient } from '@/features/recipes/schemas/recipe.schema';
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
import type { WeightUnit } from '@/shared/units/types';
import { convertWeightToGrams } from '@/shared/units/conversion';

const WEIGHT_UNIT_OPTIONS: WeightUnit[] = ['g', 'kg', 'mg', 'oz', 'lb'];

interface Props {
  ingredient: Ingredient;
  onChange: (ingredient: Ingredient) => void;
  onDelete: () => void;
}

export default function IngredientRow({ ingredient, onChange, onDelete }: Props) {
  const handleChange = (field: keyof Ingredient, value: string) => {
    onChange({ ...ingredient, [field]: field === 'name' ? value : Number(value) });
  };

  const handleUnitChange = (unit: string) => {
    onChange({ ...ingredient, unit });
  };

  const unit = (ingredient.unit || 'g') as WeightUnit;
  const weight = ingredient.weight || 0;
  const gramsResult = unit !== 'g' ? convertWeightToGrams(weight, unit) : null;
  const gramsLabel = gramsResult?.status === 'available' && gramsResult.grams !== weight
    ? `(${round1dp(gramsResult.grams!)} g)`
    : '';

  const totalCal = weight > 0 ? round1dp(calcIngredientCalories(weight, ingredient.caloriesPer100g)) : 0;
  const totalProt = weight > 0 ? round1dp(calcIngredientProtein(weight, ingredient.proteinPer100g)) : 0;
  const totalCarbs = weight > 0 ? round1dp(calcIngredientCarbs(weight, ingredient.carbsPer100g)) : 0;
  const totalFat = weight > 0 ? round1dp(calcIngredientFat(weight, ingredient.fatPer100g)) : 0;

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="col-span-2 sm:col-span-1 space-y-1.5">
          <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Ingredient
          </Label>
          <Input value={ingredient.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Chicken breast" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Quantity</Label>
          <Input
            type="text"
            inputMode="decimal"
            value={ingredient.weight || ''}
            onChange={(e) => handleChange('weight', e.target.value)}
            placeholder="200"
          />
          {gramsLabel && <span className="text-[10px] text-muted-foreground">{gramsLabel}</span>}
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Unit</Label>
          <Select value={unit} onValueChange={handleUnitChange}>
            <SelectTrigger>
              <SelectValue>{UNIT_META[unit]?.abbr || unit}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {WEIGHT_UNIT_OPTIONS.map((u) => (
                <SelectItem key={u} value={u}>{UNIT_META[u].abbr}</SelectItem>
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
        <span className="text-xs font-medium bg-background px-2 py-0.5 rounded-md border">{totalCal} kcal</span>
        <span className="text-xs font-medium bg-background px-2 py-0.5 rounded-md border">{totalProt}g P</span>
        <span className="text-xs font-medium bg-background px-2 py-0.5 rounded-md border">{totalCarbs}g C</span>
        <span className="text-xs font-medium bg-background px-2 py-0.5 rounded-md border">{totalFat}g F</span>
        <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 text-muted-foreground hover:text-destructive" onClick={onDelete} aria-label={`Remove ${ingredient.name || 'ingredient'}`}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
