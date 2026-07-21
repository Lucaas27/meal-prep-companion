import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useRecipes } from '@/features/recipes/hooks';
import {
  useMealPlanEntries,
  useCreateMealPlanEntry,
  useUpdateMealPlanEntry,
  useDeleteMealPlanEntry,
  useDuplicateMealPlanEntry,
  useMoveMealPlanEntry,
} from '../hooks/use-meal-plan';
import { getMonday, getWeekDays, formatDate, addWeeks, isSameDay } from '@/shared/utils/date';
import { calcBatchTotals, calcPerPortion } from '@/features/recipes/utils/calculations';
import { round1dp } from '@/shared/utils/format';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  AlertTriangle,
  Pencil,
  Trash2,
  Copy,
  ArrowRightLeft,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { MealPlanEntry } from '../schemas/meal-plan.schema';
import type { Recipe } from '@/features/recipes/schemas/recipe.schema';
import { MealFormDialog } from '../components/MealFormDialog';

const SLOT_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
const SLOT_LABELS: Record<string, string> = {
  breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack',
};
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getRecipeCalories(recipe: Recipe): number {
  const valid = recipe.ingredients.filter((i) => i.weight > 0);
  const totals = calcBatchTotals(valid);
  return recipe.portions > 0 ? totals.totalCalories / recipe.portions : 0;
}

export default function PlannerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: recipes = [] } = useRecipes();
  const [selectedDay, setSelectedDay] = useState<number>(
    new Date().getDay() === 0 ? 6 : new Date().getDay() - 1,
  );

  const createEntry = useCreateMealPlanEntry();
  const updateEntry = useUpdateMealPlanEntry();
  const deleteEntry = useDeleteMealPlanEntry();
  const duplicateEntry = useDuplicateMealPlanEntry();
  const moveEntry = useMoveMealPlanEntry();

  const weekParam = searchParams.get('week') || formatDate(getMonday(new Date()));
  const monday = useMemo(() => new Date(weekParam + 'T00:00:00'), [weekParam]);
  const days = useMemo(() => getWeekDays(monday), [monday]);
  const sunday = formatDate(days[6]);

  const { data: entries = [], isLoading, error } = useMealPlanEntries(formatDate(monday), sunday);

  const [formOpen, setFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MealPlanEntry | null>(null);
  const [defaultDate, setDefaultDate] = useState('');
  const [defaultSlot, setDefaultSlot] = useState('');

  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moveTarget, setMoveTarget] = useState<MealPlanEntry | null>(null);
  const [moveDate, setMoveDate] = useState('');
  const [moveSlot, setMoveSlot] = useState('');

  const recipeMap = useMemo(() => {
    const map = new Map<string, Recipe>();
    for (const r of recipes) map.set(r.id, r);
    return map;
  }, [recipes]);

  const grouped = useMemo(() => {
    const groups = new Map<string, Map<string, MealPlanEntry[]>>();
    for (const entry of entries) {
      const date = groups.get(entry.plannedDate) || new Map();
      const slot = date.get(entry.mealSlot) || [];
      slot.push(entry);
      date.set(entry.mealSlot, slot);
      groups.set(entry.plannedDate, date);
    }
    return groups;
  }, [entries]);

  const navigateWeek = (dir: number) => {
    setSearchParams({ week: formatDate(addWeeks(monday, dir)) });
  };

  const goToday = () => {
    setSearchParams({ week: formatDate(getMonday(new Date())) });
  };

  const handleAdd = (date: string, slot: string) => {
    setEditingEntry(null);
    setDefaultDate(date);
    setDefaultSlot(slot);
    setFormOpen(true);
  };

  const handleEdit = (entry: MealPlanEntry) => {
    setEditingEntry(entry);
    setFormOpen(true);
  };

  const handleSave = (entry: MealPlanEntry) => {
    const action = editingEntry ? updateEntry : createEntry;
    action.mutate(entry, {
      onSuccess: () => toast.success(editingEntry ? 'Meal updated!' : 'Meal added!'),
      onError: () => toast.error('Failed to save meal. Your changes are preserved.'),
    });
  };

  const handleDelete = (entry: MealPlanEntry) => {
    if (confirm(`Remove "${recipeMap.get(entry.recipeId)?.name ?? 'meal'}" from the planner?`)) {
      deleteEntry.mutate(entry.id, {
        onSuccess: () => toast.success('Meal removed!'),
      });
    }
  };

  const handleDuplicate = (entry: MealPlanEntry) => {
    duplicateEntry.mutate(entry, {
      onSuccess: () => toast.success('Meal duplicated!'),
    });
  };

  const handleOpenMove = (entry: MealPlanEntry) => {
    setMoveTarget(entry);
    setMoveDate(entry.plannedDate);
    setMoveSlot(entry.mealSlot);
    setMoveDialogOpen(true);
  };

  const handleMove = () => {
    if (!moveTarget) return;
    moveEntry.mutate(
      { id: moveTarget.id, plannedDate: moveDate, mealSlot: moveSlot as MealPlanEntry['mealSlot'] },
      {
        onSuccess: () => {
          toast.success('Meal moved!');
          setMoveDialogOpen(false);
        },
      },
    );
  };

  const dayTotals = useMemo(() => {
    const totals = new Map<string, { kcal: number }>();
    for (const day of days) {
      const key = formatDate(day);
      const dayEntries = entries.filter((e) => e.plannedDate === key);
      let kcal = 0;
      for (const e of dayEntries) {
        const recipe = recipeMap.get(e.recipeId);
        if (recipe) {
          kcal += getRecipeCalories(recipe) * e.servings;
        }
      }
      totals.set(key, { kcal });
    }
    return totals;
  }, [entries, recipeMap, days]);

  const missingRecipes = entries.filter((e) => !recipeMap.has(e.recipeId));

  const renderEntry = (e: MealPlanEntry, compact = false) => {
    const recipe = recipeMap.get(e.recipeId);
    if (!recipe) return (
      <div key={e.id} className="text-[10px] text-destructive py-1">Unknown recipe</div>
    );
    const per = recipe.portions > 0
      ? calcPerPortion(calcBatchTotals(recipe.ingredients.filter((i) => i.weight > 0)), recipe.portions)
      : null;

    return (
      <div key={e.id} className={cn('group relative', compact ? 'text-xs bg-muted/50 rounded px-1.5 py-0.5 mt-0.5' : 'rounded-lg border p-3')}>
        {compact ? (
          <>
            <div className="flex items-center justify-between">
              <span className="font-medium truncate">{recipe.name}</span>
              <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleEdit(e)}><Pencil className="h-3 w-3" /></Button>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleDuplicate(e)}><Copy className="h-3 w-3" /></Button>
                <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => handleDelete(e)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
            {e.servings > 1 && <span className="text-[10px] text-muted-foreground">×{e.servings}</span>}
            {per && <span className="text-[10px] text-muted-foreground ml-1">{round1dp(per.caloriesPerPortion * e.servings)} kcal</span>}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm">{recipe.name}</span>
              <div className="flex items-center gap-0.5">
                {e.servings > 1 && <Badge variant="secondary" className="text-[10px]">×{e.servings}</Badge>}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(e)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDuplicate(e)}><Copy className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleOpenMove(e)}><ArrowRightLeft className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(e)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
            {per && (
              <div className="flex gap-3 mt-1 text-[11px] text-muted-foreground">
                <span>{round1dp(per.caloriesPerPortion * e.servings)} kcal</span>
                <span>{round1dp(per.proteinPerPortion * e.servings)}g P</span>
                <span>{round1dp(per.carbsPerPortion * e.servings)}g C</span>
                <span>{round1dp(per.fatPerPortion * e.servings)}g F</span>
              </div>
            )}
            {e.notes && <p className="text-[11px] text-muted-foreground mt-1">{e.notes}</p>}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground">
            {formatDate(monday)} – {formatDate(days[6])}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-8" onClick={() => navigateWeek(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={goToday}>Today</Button>
          <Button variant="outline" size="sm" className="h-8" onClick={() => navigateWeek(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {missingRecipes.length > 0 && (
        <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/50 p-3 flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0 mt-0.5" />
          <p className="text-sm text-yellow-700 dark:text-yellow-400">
            {missingRecipes.length} meal plan {missingRecipes.length === 1 ? 'entry has' : 'entries have'} missing recipes.
          </p>
        </div>
      )}

      {isLoading && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground text-sm">Loading...</CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground text-sm">Failed to load plan entries.</CardContent>
        </Card>
      )}

      {!isLoading && !error && (
        <>
          <div className="md:hidden flex gap-1 overflow-x-auto pb-2">
            {days.map((day, idx) => {
              const key = formatDate(day);
              const t = dayTotals.get(key);
              return (
                <button
                  key={key}
                  onClick={() => setSelectedDay(idx)}
                  className={cn(
                    'flex-shrink-0 rounded-lg border px-3 py-2 text-xs text-center min-w-[72px]',
                    selectedDay === idx ? 'border-primary bg-primary/5 text-primary' : 'text-muted-foreground',
                  )}
                >
                  <span className="block font-medium">{DAY_LABELS[idx]}</span>
                  <span className="block text-[10px]">{day.getDate()}</span>
                  {t && <span className="block text-[10px] mt-0.5">{round1dp(t.kcal)} kcal</span>}
                </button>
              );
            })}
          </div>

          <div className="hidden md:grid grid-cols-7 gap-2">
            {days.map((day) => {
              const key = formatDate(day);
              const dayData = grouped.get(key) || new Map();
              const t = dayTotals.get(key);
              const today = isSameDay(day, new Date());
              return (
                <div key={key} className={cn('rounded-lg border p-2 space-y-1.5', today && 'border-primary/50 bg-primary/5')}>
                  <div className="text-center">
                    <span className="text-xs font-semibold">
                      {DAY_LABELS[day.getDay() === 0 ? 6 : day.getDay() - 1]} {day.getDate()}
                    </span>
                    {t && <span className="block text-[10px] text-muted-foreground">{round1dp(t.kcal)} kcal</span>}
                  </div>
                  {SLOT_ORDER.map((slot) => {
                    const slotEntries = dayData.get(slot) || [];
                    return (
                      <div key={slot} className="min-h-[40px]">
                        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{SLOT_LABELS[slot]}</span>
                        {slotEntries.map((e: MealPlanEntry) => renderEntry(e, true))}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full h-6 text-[10px] text-muted-foreground mt-0.5"
                          onClick={() => handleAdd(key, slot)}
                        >
                          <Plus className="h-3 w-3 mr-0.5" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          <div className="md:hidden space-y-3">
            {(() => {
              const key = formatDate(days[selectedDay]);
              const dayData = grouped.get(key) || new Map();
              return SLOT_ORDER.map((slot) => {
                const slotEntries = dayData.get(slot) || [];
                return (
                  <div key={slot}>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">{SLOT_LABELS[slot]}</h3>
                    {slotEntries.length === 0 ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start text-muted-foreground"
                        onClick={() => handleAdd(key, slot)}
                      >
                        <Plus className="h-3 w-3 mr-1" /> Add {SLOT_LABELS[slot]}
                      </Button>
                    ) : (
                      <div className="space-y-1">
                        {slotEntries.map((e: MealPlanEntry) => renderEntry(e))}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </>
      )}

      <MealFormDialog
        key={editingEntry?.id ?? `${defaultDate}-${defaultSlot}`}
        open={formOpen}
        onOpenChange={setFormOpen}
        entry={editingEntry}
        defaultDate={defaultDate}
        defaultSlot={defaultSlot}
        recipes={recipes}
        onSave={handleSave}
      />

      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle>Move Meal</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Date</Label>
              <Input type="date" value={moveDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMoveDate(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Slot</Label>
              <Select value={moveSlot} onValueChange={setMoveSlot}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SLOT_ORDER.map((s) => (
                    <SelectItem key={s} value={s}>{SLOT_LABELS[s]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMoveDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleMove} disabled={!moveDate}>Move</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
