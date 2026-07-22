import { useState, useMemo } from 'react';
import type { MealPlanEntry } from '../schemas/meal-plan.schema';
import type { Recipe } from '@/features/recipes/schemas/recipe.schema';
import { getRecipePerPortion } from '@/features/recipes/utils/recipe-nutrition';
import { formatNutrient, formatCalories } from '@/shared/utils/format';
import { makeId } from '@/shared/lib/ids';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ChevronsUpDown, Check } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

const MEAL_SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const SLOT_LABELS: Record<string, string> = {
  breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack',
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: MealPlanEntry | null;
  defaultDate?: string;
  defaultSlot?: string;
  recipes: Recipe[];
  flatConversions: Map<string, number>;
  onSave: (entry: MealPlanEntry) => void;
}

export function MealFormDialog({
  open,
  onOpenChange,
  entry,
  defaultDate,
  defaultSlot,
  recipes,
  flatConversions,
  onSave,
}: Props) {
  const isEditing = entry !== null;

  const [recipeId, setRecipeId] = useState(entry?.recipeId ?? '');
  const [servings, setServings] = useState(entry ? String(entry.servings) : '1');
  const [notes, setNotes] = useState(entry?.notes ?? '');
  const [plannedDate, setPlannedDate] = useState(entry?.plannedDate ?? defaultDate ?? '');
  const [mealSlot, setMealSlot] = useState<string>(entry?.mealSlot ?? defaultSlot ?? 'lunch');
  const [comboboxOpen, setComboboxOpen] = useState(false);

  const selectedRecipe = useMemo(() => recipes.find((r) => r.id === recipeId), [recipes, recipeId]);

  const per = useMemo(() => {
    if (!selectedRecipe) return null;
    return getRecipePerPortion(selectedRecipe, flatConversions);
  }, [selectedRecipe, flatConversions]);

  const canSave = recipeId && plannedDate && Number(servings) > 0;

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      id: entry?.id ?? makeId(),
      recipeId,
      plannedDate,
      mealSlot: mealSlot as MealPlanEntry['mealSlot'],
      servings: Number(servings),
      notes,
      position: entry?.position ?? 0,
      createdAt: entry?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Meal' : 'Add Meal'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the meal details.' : 'Select a recipe and set the meal slot.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Recipe</Label>
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between text-sm font-normal">
                  {selectedRecipe ? selectedRecipe.name : 'Select recipe...'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search recipes..." />
                  <CommandList>
                    <CommandEmpty>No recipes found.</CommandEmpty>
                    <CommandGroup>
                      {recipes.map((r) => (
                        <CommandItem
                          key={r.id}
                          value={`${r.name}::${r.id}`}
                          onSelect={() => {
                            setRecipeId(r.id);
                            setComboboxOpen(false);
                          }}
                        >
                          <Check className={cn('mr-2 h-4 w-4', r.id === recipeId ? 'opacity-100' : 'opacity-0')} />
                          <span className="flex-1">{r.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatCalories(getRecipeCalories(r, flatConversions))} kcal
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Date</Label>
              <Input type="date" value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Slot</Label>
              <Select value={mealSlot} onValueChange={setMealSlot}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MEAL_SLOTS.map((s) => (
                    <SelectItem key={s} value={s}>{SLOT_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Servings</Label>
              <Input type="number" value={servings} onChange={(e) => setServings(e.target.value)} min="1" step="1" />
            </div>
            {per && (
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Per Serving</Label>
                <div className="text-xs text-muted-foreground pt-2">
                  {formatCalories(per.caloriesPerPortion)} kcal · {formatNutrient(per.proteinPerPortion)}g P
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Notes</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes..." rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {isEditing ? 'Save Changes' : 'Add Meal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getRecipeCalories(recipe: Recipe, flatConversions: Map<string, number>): number {
  return getRecipePerPortion(recipe, flatConversions)?.caloriesPerPortion ?? 0;
}
