import { useState, useCallback } from 'react';
import type { Ingredient, Recipe } from '../schemas/recipe.schema';
import type { StoredIngredient } from '@/features/ingredients/schemas/ingredient.schema';
import { calcBatchTotals, calcPerPortion } from '../utils/calculations';
import { makeId } from '@/shared/lib/ids';
import { DEFAULT_PORTIONS } from '@/shared/constants/defaults';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import IngredientRow from './IngredientRow';
import NutritionSummary from './NutritionSummary';
import { Plus, ShoppingBasket } from 'lucide-react';

function makeBlankIngredient(): Ingredient {
  return { id: makeId(), name: '', weight: 0, caloriesPer100g: 0, proteinPer100g: 0 };
}

interface FormProps {
  recipe: Recipe | null;
  onSave: (recipe: Recipe) => void;
  onOpenChange: (open: boolean) => void;
  storedIngredients: StoredIngredient[];
}

function RecipeSheetForm({ recipe, onSave, onOpenChange, storedIngredients }: FormProps) {
  const isEditing = recipe !== null;

  const [name, setName] = useState(recipe?.name ?? '');
  const [portions, setPortions] = useState(recipe?.portions ?? DEFAULT_PORTIONS);
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    recipe?.ingredients ?? [makeBlankIngredient()],
  );

  const updateIngredient = useCallback((updated: Ingredient) => {
    setIngredients((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }, []);

  const removeIngredient = useCallback((id: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const addFromCatalogue = (si: StoredIngredient) => {
    const existing = ingredients.find(
      (i) => i.name.toLowerCase() === si.name.toLowerCase() && i.weight === 0,
    );
    if (existing) {
      updateIngredient({
        ...existing,
        caloriesPer100g: si.caloriesPer100g,
        proteinPer100g: si.proteinPer100g,
      });
    } else {
      setIngredients((prev) => [
        ...prev,
        { id: makeId(), name: si.name, weight: 0, caloriesPer100g: si.caloriesPer100g, proteinPer100g: si.proteinPer100g },
      ]);
    }
  };

  const validIngredients = ingredients.filter(
    (i) => i.weight > 0 && i.caloriesPer100g > 0 && i.proteinPer100g > 0,
  );

  const totals = calcBatchTotals(validIngredients);
  const perPortion = portions > 0 ? calcPerPortion(totals, portions) : null;
  const canSave = name.trim().length > 0 && portions > 0 && validIngredients.length > 0;

  const handleSave = () => {
    if (!canSave) return;
    const saved: Recipe = {
      id: recipe?.id ?? makeId(),
      name: name.trim(),
      portions,
      ingredients,
      createdAt: recipe?.createdAt ?? Date.now(),
    };
    onSave(saved);
    onOpenChange(false);
  };

  return (
    <>
      <SheetHeader className="px-6 pt-6 pb-3">
        <SheetTitle>{isEditing ? 'Edit Recipe' : 'New Recipe'}</SheetTitle>
        <SheetDescription>
          {isEditing
            ? 'Update ingredients and portions.'
            : 'Add ingredients and set portions.'}
        </SheetDescription>
      </SheetHeader>

      <ScrollArea className="flex-1 px-6">
        <div className="space-y-5 pb-6">
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor="recipe-name" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Recipe name
              </Label>
              <Input
                id="recipe-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Chicken & Rice Meal Prep"
              />
            </div>
            <div className="w-24 space-y-1.5">
              <Label htmlFor="recipe-portions" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Portions
              </Label>
              <Input
                id="recipe-portions"
                type="number"
                value={portions || ''}
                onChange={(e) => setPortions(Number(e.target.value))}
                min="1"
                step="1"
              />
            </div>
          </div>

          {storedIngredients.length > 0 && (
            <div>
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                Quick add from catalogue
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {storedIngredients.map((si) => (
                  <Tooltip key={si.id}>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addFromCatalogue(si)}
                        className="text-xs h-7"
                      >
                        <ShoppingBasket className="h-3 w-3 mr-1" />
                        {si.name}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {si.caloriesPer100g} kcal / {si.proteinPer100g}g protein per 100g
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-3">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Ingredients ({ingredients.length})
            </Label>

            {ingredients.map((ing) => (
              <IngredientRow
                key={ing.id}
                ingredient={ing}
                onChange={updateIngredient}
                onDelete={() => removeIngredient(ing.id)}
              />
            ))}

            <Button variant="outline" size="sm" onClick={() => setIngredients((prev) => [...prev, makeBlankIngredient()])} className="w-full">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Ingredient
            </Button>
          </div>

          {validIngredients.length > 0 && (
            <NutritionSummary totals={totals} perPortion={perPortion} portions={portions} />
          )}
        </div>
      </ScrollArea>

      <SheetFooter className="px-6 py-4 border-t">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!canSave}>
          {isEditing ? 'Update Recipe' : 'Save Recipe'}
        </Button>
      </SheetFooter>
    </>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe: Recipe | null;
  onSave: (recipe: Recipe) => void;
  storedIngredients: StoredIngredient[];
}

export default function RecipeSheet({ open, onOpenChange, recipe, onSave, storedIngredients }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col p-0">
        {open && (
          <RecipeSheetForm
            key={recipe?.id ?? 'new'}
            recipe={recipe}
            onSave={onSave}
            onOpenChange={onOpenChange}
            storedIngredients={storedIngredients}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
