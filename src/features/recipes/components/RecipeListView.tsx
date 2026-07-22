import { calcBatchTotals, calcPerPortion } from '../utils/calculations';
import { formatNutrient } from '@/shared/utils/format';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Star, Pencil, Copy, Trash2, Square, CheckSquare } from 'lucide-react';
import type { RecipeViewProps } from './RecipeGridView';

export function RecipeListView({
  recipes,
  onEdit,
  onDuplicate,
  onDelete,
  onToggleFavourite,
  selectedIds,
  onToggleSelect,
  allSelected,
  toggleSelectAll,
}: RecipeViewProps) {
  const showSelect = !!onToggleSelect;
  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            {showSelect && (
              <TableHead className="w-[30px]">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={toggleSelectAll}>
                  {allSelected ? (
                    <CheckSquare className="h-4 w-4 text-primary" />
                  ) : (
                    <Square className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </TableHead>
            )}
            <TableHead className="w-[30px]" />
            <TableHead>Name</TableHead>
            <TableHead className="text-right">kcal</TableHead>
            <TableHead className="text-right hidden sm:table-cell">P</TableHead>
            <TableHead className="text-right hidden md:table-cell">C</TableHead>
            <TableHead className="text-right hidden md:table-cell">F</TableHead>
            <TableHead className="text-right">Portions</TableHead>
            <TableHead className="hidden lg:table-cell">Tags</TableHead>
            <TableHead className="hidden xl:table-cell">Created</TableHead>
            <TableHead className="w-[100px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {recipes.map((recipe) => {
            const valid = recipe.ingredients.filter(
              (i) => i.weight > 0,
            );
            const totals = calcBatchTotals(valid);
            const per = recipe.portions > 0 ? calcPerPortion(totals, recipe.portions) : null;

            return (
              <TableRow
                key={recipe.id}
                className="cursor-pointer"
                onClick={() => onEdit(recipe)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onEdit(recipe);
                  }
                }}
              >
                {showSelect && (
                  <TableCell className="w-[30px]" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onToggleSelect!(recipe.id)}>
                      {selectedIds?.has(recipe.id) ? (
                        <CheckSquare className="h-4 w-4 text-primary" />
                      ) : (
                        <Square className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </TableCell>
                )}
                <TableCell className="w-[30px]">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavourite(recipe);
                    }}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        recipe.favourite
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground/40'
                      }`}
                    />
                  </Button>
                </TableCell>
                <TableCell className="font-medium">{recipe.name}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {per ? formatNutrient(per.caloriesPerPortion) : '—'}
                </TableCell>
                <TableCell className="text-right tabular-nums hidden sm:table-cell">
                  {per ? `${formatNutrient(per.proteinPerPortion)}g` : '—'}
                </TableCell>
                <TableCell className="text-right tabular-nums hidden md:table-cell">
                  {per ? `${formatNutrient(per.carbsPerPortion)}g` : '—'}
                </TableCell>
                <TableCell className="text-right tabular-nums hidden md:table-cell">
                  {per ? `${formatNutrient(per.fatPerPortion)}g` : '—'}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {recipe.portions}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <div className="flex flex-wrap gap-1">
                    {recipe.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px] font-medium">
                        {tag}
                      </Badge>
                    ))}
                    {recipe.tags.length > 2 && (
                      <span className="text-[10px] text-muted-foreground">+{recipe.tags.length - 2}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden lg:table-cell text-muted-foreground text-xs">
                  {new Date(recipe.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-0.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(recipe);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicate(recipe);
                          }}
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Duplicate</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(recipe.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
