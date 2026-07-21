import type { Recipe } from '../schemas/recipe.schema';
import { calcBatchTotals, calcPerPortion } from '../utils/calculations';
import { round1dp } from '@/shared/utils/format';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Pencil, Copy, Trash2, Plus, ChefHat } from 'lucide-react';

interface Props {
  recipes: Recipe[];
  onEdit: (recipe: Recipe) => void;
  onDuplicate: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

export default function RecipeLibrary({ recipes, onEdit, onDuplicate, onDelete, onNew }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Recipes</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
          </p>
        </div>
        <Button onClick={onNew} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          New
        </Button>
      </div>

      {recipes.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <ChefHat className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-sm mb-4">No recipes yet. Create your first meal prep recipe.</p>
            <Button onClick={onNew}>
              <Plus className="h-4 w-4 mr-1.5" />
              Create Recipe
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {recipes.map((recipe) => {
            const valid = recipe.ingredients.filter(
              (i) => i.weight > 0 && i.caloriesPer100g > 0 && i.proteinPer100g > 0,
            );
            const totals = calcBatchTotals(valid);
            const per = recipe.portions > 0 ? calcPerPortion(totals, recipe.portions) : null;

            return (
              <Card key={recipe.id} className="transition-shadow duration-200 hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-[15px] leading-tight">{recipe.name}</h3>
                      <p className="text-[13px] text-muted-foreground mt-0.5">{recipe.portions} portions</p>
                    </div>
                  </div>

                  {per && (
                    <div className="grid grid-cols-3 gap-2.5 mb-4">
                      <div className="bg-muted/70 rounded-lg p-2.5 text-center">
                        <span className="block text-base font-semibold tracking-tight">
                          {round1dp(per.caloriesPerPortion)}
                        </span>
                        <span className="block text-[11px] text-muted-foreground mt-0.5">kcal</span>
                      </div>
                      <div className="bg-muted/70 rounded-lg p-2.5 text-center">
                        <span className="block text-base font-semibold tracking-tight">
                          {round1dp(per.proteinPerPortion)}g
                        </span>
                        <span className="block text-[11px] text-muted-foreground mt-0.5">protein</span>
                      </div>
                      <div className="bg-muted/70 rounded-lg p-2.5 text-center">
                        <span className="block text-base font-semibold tracking-tight">
                          {round1dp(per.weightPerPortion)}g
                        </span>
                        <span className="block text-[11px] text-muted-foreground mt-0.5">weight</span>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {recipe.ingredients.map((ing) => (
                      <Badge key={ing.id} variant="secondary" className="text-[11px] font-medium">
                        {ing.name} ({ing.weight}g)
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-0.5 border-t pt-3">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => onEdit(recipe)} className="h-8">
                          <Pencil className="h-3.5 w-3.5 mr-1.5" />
                          Edit
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit recipe</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={() => onDuplicate(recipe)} className="h-8">
                          <Copy className="h-3.5 w-3.5 mr-1.5" />
                          Duplicate
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Duplicate recipe</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-destructive ml-auto"
                          onClick={() => onDelete(recipe.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete recipe</TooltipContent>
                    </Tooltip>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
