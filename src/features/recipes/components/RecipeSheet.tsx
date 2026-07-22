import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Ingredient, Recipe } from '../schemas/recipe.schema';
import type { StoredIngredient } from '@/features/ingredients/schemas/ingredient.schema';
import { calcBatchTotals, calcPerPortion } from '../utils/calculations';
import { makeId } from '@/shared/lib/ids';
import { DEFAULT_PORTIONS } from '@/shared/constants/defaults';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import IngredientRow from './IngredientRow';
import NutritionSummary from './NutritionSummary';
import { Plus, ShoppingBasket, Star, X, Check, ChevronsUpDown, ArrowLeft } from 'lucide-react';
import { normaliseName, formatNutrient, formatCalories } from '@/shared/utils/format';
import { useConversionsForIngredients } from '@/features/ingredients/conversions/use-unit-conversions';

const STARTER_TAGS = [
  'High Protein', 'Low Calorie', 'Meal Prep', 'Quick',
  'Breakfast', 'Lunch', 'Dinner', 'Snack', 'Vegetarian',
];

function makeBlankIngredient(): Ingredient {
  return { id: makeId(), name: '', weight: 0, unit: 'g', unitConversionId: null, caloriesPer100g: 0, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 0 };
}

function makeIngredientFromCatalogue(si: StoredIngredient): Ingredient {
  return { id: si.id, name: si.name, weight: 100, unit: 'g', unitConversionId: null, caloriesPer100g: si.caloriesPer100g, proteinPer100g: si.proteinPer100g, carbsPer100g: si.carbsPer100g, fatPer100g: si.fatPer100g };
}

interface FormProps {
  recipe: Recipe | null;
  onSave: (recipe: Recipe) => void;
  storedIngredients: StoredIngredient[];
}

export default function RecipeEditorPage({ recipe, onSave, storedIngredients }: FormProps) {
  const navigate = useNavigate();
  const isEditing = recipe !== null;

  const initialName = recipe?.name ?? '';
  const initialPortions = recipe?.portions ?? DEFAULT_PORTIONS;
  const initialIngredients = useMemo(() => recipe?.ingredients ?? [], [recipe?.ingredients]);
  const initialTags = useMemo(() => recipe?.tags ?? [], [recipe?.tags]);
  const initialFavourite = recipe?.favourite ?? false;
  const initialNotes = recipe?.notes ?? '';

  const [name, setName] = useState(initialName);
  const [portions, setPortions] = useState(initialPortions);
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    recipe?.ingredients ? recipe.ingredients.map((i) => ({ ...i })) : [],
  );
  const [tags, setTags] = useState<string[]>([...initialTags]);
  const [tagInput, setTagInput] = useState('');
  const [favourite, setFavourite] = useState(initialFavourite);
  const [notes, setNotes] = useState(initialNotes);
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const ingredientIds = useMemo(() => ingredients.map((ing) => ing.id), [ingredients]);
  const { data: conversionsMap = new Map() } = useConversionsForIngredients(ingredientIds);
  const storedIds = useMemo(() => new Set(storedIngredients.map((s) => s.id)), [storedIngredients]);

  const isDirty = useMemo(() => {
    if (name !== initialName) return true;
    if (portions !== initialPortions) return true;
    if (favourite !== initialFavourite) return true;
    if (notes !== initialNotes) return true;
    if (tags.length !== initialTags.length || !tags.every((t, i) => t === initialTags[i])) return true;
    if (ingredients.length !== initialIngredients.length) return true;
    return !ingredients.every((ing, i) => {
      const orig = initialIngredients[i];
      if (!orig) return true;
      return ing.id === orig.id && ing.name === orig.name && ing.weight === orig.weight && ing.unit === orig.unit && ing.caloriesPer100g === orig.caloriesPer100g && ing.proteinPer100g === orig.proteinPer100g;
    });

  }, [name, portions, ingredients, tags, favourite, notes, initialName, initialPortions, initialIngredients, initialTags, initialFavourite, initialNotes]);

  const handleClose = useCallback(() => {
    if (isDirty) {
      setConfirmOpen(true);
    } else {
      navigate('/recipes');
    }
  }, [isDirty, navigate]);

  const updateIngredient = useCallback((updated: Ingredient) => {
    setIngredients((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }, []);

  const removeIngredient = useCallback((id: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const addFromCatalogue = (si: StoredIngredient) => {
    const duplicate = ingredients.find(
      (i) => normaliseName(i.name) === normaliseName(si.name),
    );
    if (duplicate) {
      updateIngredient({ ...duplicate, weight: duplicate.weight || 100 });
      return;
    }
    setIngredients((prev) => [...prev, makeIngredientFromCatalogue(si)]);
    setComboboxOpen(false);
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const validIngredients = ingredients.filter(
    (i) => i.weight > 0,
  );

  // ponytail: flatten Map<string, UnitConversion[]> to Map<string, number> (id → gramsPerUnit)
  const flatConversions = useMemo(() => {
    const m = new Map<string, number>();
    for (const convs of conversionsMap.values()) {
      for (const c of convs) m.set(c.id, c.gramsPerUnit);
    }
    return m;
  }, [conversionsMap]);

  const totals = calcBatchTotals(validIngredients, flatConversions);
  const perPortion = portions > 0 ? calcPerPortion(totals, portions) : null;
  const canSave = name.trim().length > 0 && portions > 0 && validIngredients.length > 0;

  const handleSave = useCallback(() => {
    if (!canSave) return;
    const now = Date.now();
    const saved: Recipe = {
      id: recipe?.id ?? makeId(),
      name: name.trim(),
      portions,
      ingredients,
      tags,
      favourite,
      notes: notes.trim(),
      createdAt: recipe?.createdAt ?? now,
      updatedAt: now,
    };
    onSave(saved);
  }, [canSave, name, portions, ingredients, tags, favourite, notes, recipe?.id, recipe?.createdAt, onSave]);

  const handleSaveRef = useRef(handleSave);

  useEffect(() => {
    handleSaveRef.current = handleSave;
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSaveRef.current();
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [handleSave]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={handleClose}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">{isEditing ? 'Edit Recipe' : 'New Recipe'}</h1>
          <p className="text-sm text-muted-foreground">
            {isEditing ? 'Update ingredients and portions.' : 'Add ingredients and set portions.'}
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setFavourite((f) => !f)}>
              <Star className={`h-[18px] w-[18px] ${favourite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{favourite ? 'Remove favourite' : 'Add to favourites'}</TooltipContent>
        </Tooltip>
      </div>

      <div className="space-y-5">
        <div className="flex gap-3 items-end">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="recipe-name" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Recipe name</Label>
            <Input id="recipe-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Chicken & Rice Meal Prep" />
          </div>
          <div className="w-24 space-y-1.5">
            <Label htmlFor="recipe-portions" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Portions</Label>
            <Input id="recipe-portions" type="number" value={portions || ''} onChange={(e) => setPortions(Number(e.target.value))} min="1" step="1" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tags</Label>
          <div className="flex flex-wrap gap-1 mb-1.5">
            {STARTER_TAGS.filter((st) => !tags.includes(st)).map((st) => (
              <Badge key={st} variant="outline" className="text-[10px] cursor-pointer hover:bg-secondary" onClick={() => setTags((prev) => [...prev, st])}>
                <Plus className="h-2.5 w-2.5 mr-0.5" />{st}
              </Badge>
            ))}
          </div>
          <div className="flex gap-1.5">
            <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }} placeholder="Add custom tag..." className="flex-1" />
            <Button variant="outline" size="sm" onClick={addTag} type="button">Add</Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-[11px] gap-1 pr-1">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-destructive ml-0.5" aria-label={`Remove tag ${tag}`}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="recipe-notes" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Notes</Label>
          <Textarea id="recipe-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Cooking instructions, storage tips, substitutions..." rows={3} />
        </div>

        <Separator />

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Ingredients ({ingredients.length})
            </Label>
          </div>

          <Dialog open={comboboxOpen} onOpenChange={setComboboxOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full justify-between text-sm font-normal">
                <ShoppingBasket className="h-4 w-4 mr-2 text-muted-foreground" />
                Search catalogue...
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-sm font-semibold">Select Ingredient</DialogTitle>
              </DialogHeader>
              <Command>
                <CommandInput placeholder="Search ingredients..." />
                <CommandList>
                  <CommandEmpty>No ingredients found.</CommandEmpty>
                  <CommandGroup>
                    {storedIngredients.map((si) => {
                      const alreadyAdded = ingredients.some((i) => normaliseName(i.name) === normaliseName(si.name));
                      return (
                        <CommandItem
                          key={si.id}
                          value={`${si.name}::${si.id}`}
                          onSelect={() => addFromCatalogue(si)}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            {alreadyAdded && <Check className="h-4 w-4 text-muted-foreground" />}
                            <span className={alreadyAdded ? 'text-muted-foreground' : ''}>{si.name}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatCalories(si.caloriesPer100g)} kcal · {formatNutrient(si.proteinPer100g)}g P · {formatNutrient(si.carbsPer100g)}g C · {formatNutrient(si.fatPer100g)}g F
                          </span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </DialogContent>
          </Dialog>

          {ingredients.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <ShoppingBasket className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No ingredients yet. Search the catalogue above to start.</p>
            </div>
          ) : (
            <>
              {ingredients.map((ing) => (
                <IngredientRow
                  key={ing.id}
                  ingredient={ing}
                  conversions={conversionsMap.get(ing.id) || []}
                  fromCatalogue={storedIds.has(ing.id)}
                  onChange={updateIngredient}
                  onDelete={() => removeIngredient(ing.id)}
                />
              ))}
            </>
          )}
          <Button variant="outline" size="sm" onClick={() => setIngredients((prev) => [...prev, makeBlankIngredient()])} className="w-full">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Custom Ingredient
          </Button>
        </div>

        {validIngredients.length > 0 && (
          <NutritionSummary totals={totals} perPortion={perPortion} portions={portions} />
        )}
      </div>

      <div className="flex items-center justify-end gap-2 pt-4 border-t">
        <Button variant="outline" onClick={handleClose}>Cancel</Button>
        <Button onClick={handleSave} disabled={!canSave}>
          {isEditing ? 'Save Changes' : 'Create Recipe'}
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Do you want to discard them?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Editing</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate('/recipes')}>Discard</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
