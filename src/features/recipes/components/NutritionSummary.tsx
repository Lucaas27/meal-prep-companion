import { formatNutrient, formatCalories } from '@/shared/utils/format';
import type { IngredientTotals, PerPortion } from '../utils/calculations';
import { Separator } from '@/components/ui/separator';

interface Props {
  totals: IngredientTotals;
  perPortion: PerPortion | null;
  portions: number;
}

export default function NutritionSummary({ totals, perPortion, portions }: Props) {
  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Batch Totals</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <div>
            <span className="block text-lg font-semibold tracking-tight">{formatCalories(totals.totalCalories)}</span>
            <span className="block text-[11px] text-muted-foreground mt-0.5">kcal</span>
          </div>
          <div>
            <span className="block text-lg font-semibold tracking-tight">{formatNutrient(totals.totalProtein)}g</span>
            <span className="block text-[11px] text-muted-foreground mt-0.5">protein</span>
          </div>
          <div>
            <span className="block text-lg font-semibold tracking-tight">{formatNutrient(totals.totalCarbs)}g</span>
            <span className="block text-[11px] text-muted-foreground mt-0.5">carbs</span>
          </div>
          <div>
            <span className="block text-lg font-semibold tracking-tight">{formatNutrient(totals.totalFat)}g</span>
            <span className="block text-[11px] text-muted-foreground mt-0.5">fat</span>
          </div>
        </div>
      </div>

      {perPortion && (
        <>
          <Separator />
          <div>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Per Portion ({portions})
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-primary/5 rounded-lg p-3">
                <span className="block text-xl font-semibold tracking-tight text-primary">
                  {formatCalories(perPortion.caloriesPerPortion)}
                </span>
                <span className="block text-[11px] text-muted-foreground mt-0.5">kcal</span>
              </div>
              <div className="bg-primary/5 rounded-lg p-3">
                <span className="block text-xl font-semibold tracking-tight text-primary">
                  {formatNutrient(perPortion.proteinPerPortion)}g
                </span>
                <span className="block text-[11px] text-muted-foreground mt-0.5">protein</span>
              </div>
              <div className="rounded-lg p-3">
                <span className="block text-xl font-semibold tracking-tight">
                  {formatNutrient(perPortion.carbsPerPortion)}g
                </span>
                <span className="block text-[11px] text-muted-foreground mt-0.5">carbs</span>
              </div>
              <div className="rounded-lg p-3">
                <span className="block text-xl font-semibold tracking-tight">
                  {formatNutrient(perPortion.fatPerPortion)}g
                </span>
                <span className="block text-[11px] text-muted-foreground mt-0.5">fat</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
