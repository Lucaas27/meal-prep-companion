import { useState } from 'react';
import type { StoredIngredient } from '../schemas/ingredient.schema';
import { makeId } from '@/shared/lib/ids';
import { ingredientRepository } from '../repositories/ingredient.repository';
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

const CATEGORIES = ['Protein', 'Carbohydrate', 'Fat', 'Dairy', 'Vegetable', 'Fruit', 'Sauce', 'Other'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ingredient: StoredIngredient | null;
  onSave: (ingredient: StoredIngredient) => void;
}

export function IngredientFormDialog({ open, onOpenChange, ingredient, onSave }: Props) {
  const isEditing = ingredient !== null;
  const [name, setName] = useState(ingredient?.name ?? '');
  const [calories, setCalories] = useState(ingredient ? String(ingredient.caloriesPer100g) : '');
  const [protein, setProtein] = useState(ingredient ? String(ingredient.proteinPer100g) : '');
  const [carbs, setCarbs] = useState(ingredient ? String(ingredient.carbsPer100g) : '');
  const [fat, setFat] = useState(ingredient ? String(ingredient.fatPer100g) : '');
  const [category, setCategory] = useState(ingredient?.category ?? '');
  const [nameError, setNameError] = useState('');

  const canSave = name.trim().length > 0;

  const handleSave = () => {
    const normalised = name.trim();
    if (!normalised) {
      setNameError('Enter an ingredient name.');
      return;
    }

    if (ingredientRepository.existsByNormalisedName(normalised, ingredient?.id)) {
      setNameError('An ingredient with this name already exists.');
      return;
    }

    onSave({
      id: ingredient?.id ?? makeId(),
      name: normalised,
      caloriesPer100g: Number(calories) || 0,
      proteinPer100g: Number(protein) || 0,
      carbsPer100g: Number(carbs) || 0,
      fatPer100g: Number(fat) || 0,
      category,
      source: ingredient?.source ?? 'custom',
      createdAt: ingredient?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Ingredient' : 'Create Ingredient'}</DialogTitle>
          <DialogDescription>
            Nutrition values per 100g.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ing-name" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Name
            </Label>
            <Input
              id="ing-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError('');
              }}
              placeholder="Chicken Breast"
            />
            {nameError && <p className="text-xs text-destructive">{nameError}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ing-cal" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Calories / 100g
              </Label>
              <Input id="ing-cal" type="number" value={calories} onChange={(e) => setCalories(e.target.value)} placeholder="165" min="0" step="0.1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ing-prot" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Protein / 100g
              </Label>
              <Input id="ing-prot" type="number" value={protein} onChange={(e) => setProtein(e.target.value)} placeholder="31" min="0" step="0.1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ing-carbs" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Carbs / 100g
              </Label>
              <Input id="ing-carbs" type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} placeholder="0" min="0" step="0.1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ing-fat" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Fat / 100g
              </Label>
              <Input id="ing-fat" type="number" value={fat} onChange={(e) => setFat(e.target.value)} placeholder="0" min="0" step="0.1" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ing-cat" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Category
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="ing-cat">
                <SelectValue placeholder="Select category..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Uncategorised</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

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
