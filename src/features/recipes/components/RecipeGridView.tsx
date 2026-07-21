import type { Recipe } from '../schemas/recipe.schema';
import { calcBatchTotals, calcPerPortion } from '../utils/calculations';
import { round1dp } from '@/shared/utils/format';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Star, Pencil, Copy, Trash2 } from 'lucide-react';

export interface RecipeViewProps {
  recipes: Recipe[];
  onEdit: (recipe: Recipe) => void;
  onDuplicate: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
  onToggleFavourite: (recipe: Recipe) => void;
}

export function RecipeGridView({
  recipes,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleFavourite,
}: RecipeViewProps) {
  return (
    <div className="space-y-3">
      {recipes.map((recipe) => {
        const valid = recipe.ingredients.filter(
          (i) => i.weight > 0 && i.caloriesPer100g > 0 && i.proteinPer100g > 0,
        );
        const totals = calcBatchTotals(valid);
        const per = recipe.portions > 0 ? calcPerPortion(totals, recipe.portions) : null;

        return (
          <Card
            key={recipe.id}
            className="transition-shadow duration-200 hover:shadow-md cursor-pointer group"
            onClick={() => onEdit(recipe)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onEdit(recipe);
              }
            }}
          >
            <div className="p-5">
              <div className="flex items-start gap-3 mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[15px] leading-tight truncate">
                    {recipe.name}
                  </h3>
                  <p className="text-[13px] text-muted-foreground mt-0.5">
                    {recipe.portions} portions &middot; {recipe.ingredients.length} ingredients
                  </p>
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavourite(recipe);
                      }}
                    >
                      <Star
                        className={`h-[18px] w-[18px] ${
                          recipe.favourite
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity'
                        }`}
                      />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {recipe.favourite ? 'Remove favourite' : 'Add to favourites'}
                  </TooltipContent>
                </Tooltip>
              </div>

              {per && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
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
                      {round1dp(per.carbsPerPortion)}g
                    </span>
                    <span className="block text-[11px] text-muted-foreground mt-0.5">carbs</span>
                  </div>
                  <div className="bg-muted/70 rounded-lg p-2.5 text-center">
                    <span className="block text-base font-semibold tracking-tight">
                      {round1dp(per.fatPerPortion)}g
                    </span>
                    <span className="block text-[11px] text-muted-foreground mt-0.5">fat</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-1.5 flex-wrap min-h-0">
                {recipe.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-[10px] font-medium">
                    {tag}
                  </Badge>
                ))}
                {recipe.ingredients.slice(0, 3).map((ing) => (
                  <Badge key={ing.id} variant="outline" className="text-[10px] font-medium text-muted-foreground">
                    {ing.name}
                  </Badge>
                ))}
                {recipe.ingredients.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">
                    +{recipe.ingredients.length - 3} more
                  </span>
                )}
              </div>

              <div className="flex items-center gap-0.5 border-t mt-3 pt-3">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(recipe);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5 mr-1.5" />
                      Edit
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit recipe</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicate(recipe);
                      }}
                    >
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
                      className="h-8 text-muted-foreground hover:text-destructive ml-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(recipe.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete recipe</TooltipContent>
                </Tooltip>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
