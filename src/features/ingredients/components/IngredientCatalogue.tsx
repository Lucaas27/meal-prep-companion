import { useState } from 'react';
import type { StoredIngredient } from '../schemas/ingredient.schema';
import { makeId } from '@/shared/lib/ids';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2, Carrot } from 'lucide-react';

interface Props {
  ingredients: StoredIngredient[];
  onSave: (ingredient: StoredIngredient) => void;
  onDelete: (id: string) => void;
}

export default function IngredientCatalogue({ ingredients, onSave, onDelete }: Props) {
  const [name, setName] = useState('');
  const [caloriesPer100g, setCaloriesPer100g] = useState('');
  const [proteinPer100g, setProteinPer100g] = useState('');
  const [carbsPer100g, setCarbsPer100g] = useState('');
  const [fatPer100g, setFatPer100g] = useState('');

  const canAdd = name.trim().length > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    onSave({
      id: makeId(),
      name: name.trim(),
      caloriesPer100g: Number(caloriesPer100g) || 0,
      proteinPer100g: Number(proteinPer100g) || 0,
      carbsPer100g: Number(carbsPer100g) || 0,
      fatPer100g: Number(fatPer100g) || 0,
    });
    setName('');
    setCaloriesPer100g('');
    setProteinPer100g('');
    setCarbsPer100g('');
    setFatPer100g('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Catalogue</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          Save frequently used ingredients for quick recipe building.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
            <Carrot className="h-4 w-4" />
            Add Ingredient
          </CardTitle>
          <CardDescription>Per 100g nutritional values.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name" className="text-[13px]">Name</Label>
              <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Chicken breast" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-cal" className="text-[13px]">Cal / 100g</Label>
              <Input id="cat-cal" type="number" value={caloriesPer100g} onChange={(e) => setCaloriesPer100g(e.target.value)} placeholder="165" min="0" step="0.1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-prot" className="text-[13px]">Prot / 100g</Label>
              <Input id="cat-prot" type="number" value={proteinPer100g} onChange={(e) => setProteinPer100g(e.target.value)} placeholder="31" min="0" step="0.1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-carbs" className="text-[13px]">Carbs / 100g</Label>
              <Input id="cat-carbs" type="number" value={carbsPer100g} onChange={(e) => setCarbsPer100g(e.target.value)} placeholder="0" min="0" step="0.1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cat-fat" className="text-[13px]">Fat / 100g</Label>
              <Input id="cat-fat" type="number" value={fatPer100g} onChange={(e) => setFatPer100g(e.target.value)} placeholder="0" min="0" step="0.1" />
            </div>
          </div>
          <Button onClick={handleAdd} disabled={!canAdd} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Add to Catalogue
          </Button>
        </CardContent>
      </Card>

      <Separator />

      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {ingredients.length} {ingredients.length === 1 ? 'ingredient' : 'ingredients'} saved
        </h3>

        {ingredients.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Carrot className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground text-sm">
                No ingredients yet. Add one above.
              </p>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[400px] pr-1">
            <div className="space-y-2">
              {ingredients.map((ing) => (
                <div key={ing.id} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/30">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-sm truncate">{ing.name}</span>
                    {ing.caloriesPer100g > 0 && (
                      <Badge variant="secondary" className="text-[11px] font-medium shrink-0">
                        {ing.caloriesPer100g} kcal
                      </Badge>
                    )}
                    {ing.proteinPer100g > 0 && (
                      <Badge variant="secondary" className="text-[11px] font-medium shrink-0">
                        {ing.proteinPer100g}g prot
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0 ml-2"
                    onClick={() => onDelete(ing.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
