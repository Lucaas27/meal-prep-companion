import { useState, useMemo } from 'react';
import type { StoredIngredient } from '../schemas/ingredient.schema';
import type { Recipe } from '@/features/recipes/schemas/recipe.schema';
import { useRecipes } from '@/features/recipes/hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { Search, Plus, Trash2, Pencil, Carrot, Database, RefreshCw, ScanBarcode } from 'lucide-react';
import { IngredientFormDialog } from './IngredientFormDialog';
import { Pagination } from '@/shared/components/Pagination';
import { normaliseName, formatNutrient, formatCalories } from '@/shared/utils/format';
import { SOURCE_LABELS } from '../schemas/ingredient.schema';
import { ExternalFoodSearchDialog } from '@/features/external-catalogue/components/ExternalFoodSearchDialog';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import { useImportExternalIngredient } from '../hooks/use-ingredient-mutations';
import type { ImportExternalIngredientInput, ImportExternalIngredientResult } from '../services/import-external-ingredient';
import { BarcodeImportDialog } from '@/features/barcode-scanning/components/barcode-import-dialog';

const SORT_KEY = 'ingredient-catalogue-sort';
const PAGE_SIZE_KEY = 'ingredient-catalogue-page-size';

const SORT_OPTIONS = [
  { value: 'name-asc', label: 'A–Z' },
  { value: 'name-desc', label: 'Z–A' },
  { value: 'recent', label: 'Recently Updated' },
  { value: 'calories-desc', label: 'Highest Calories' },
  { value: 'calories-asc', label: 'Lowest Calories' },
  { value: 'protein-desc', label: 'Highest Protein' },
  { value: 'protein-asc', label: 'Lowest Protein' },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]['value'];

const CATEGORIES = ['Protein', 'Carbohydrate', 'Fat', 'Dairy', 'Vegetable', 'Fruit', 'Sauce', 'Other'];

function loadSort(): SortValue {
  const saved = localStorage.getItem(SORT_KEY);
  return SORT_OPTIONS.some((o) => o.value === saved) ? (saved as SortValue) : 'name-asc';
}

function getRecipeUsage(ingredientName: string, recipes: Recipe[]): number {
  const needle = normaliseName(ingredientName);
  return recipes.filter((r) =>
    r.ingredients.some((i) => normaliseName(i.name) === needle),
  ).length;
}

interface Props {
  ingredients: StoredIngredient[];
  onSave: (ingredient: StoredIngredient) => void;
  onDelete: (id: string) => void;
  onRefresh?: () => void;
}

export default function IngredientCatalogue({ ingredients, onSave, onDelete, onRefresh }: Props) {
  const { data: recipes = [] } = useRecipes();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortValue>(loadSort);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<StoredIngredient | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [barcodeOpen, setBarcodeOpen] = useState(false);
  const { confirm, dialog } = useConfirm();
  const importIngredient = useImportExternalIngredient();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(() => {
    const saved = localStorage.getItem(PAGE_SIZE_KEY);
    return saved ? Number(saved) : 10;
  });

  const filtered = useMemo(() => {
    let list = ingredients;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q),
      );
    }
    if (categoryFilter === 'none') {
      list = list.filter((i) => !i.category);
    } else if (categoryFilter !== 'all') {
      list = list.filter((i) => i.category === categoryFilter);
    }
    return list;
  }, [ingredients, search, categoryFilter]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sort) {
      case 'name-asc':
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return list.sort((a, b) => b.name.localeCompare(a.name));
      case 'recent':
        return list.sort((a, b) => b.updatedAt - a.updatedAt);
      case 'calories-desc':
        return list.sort((a, b) => b.caloriesPer100g - a.caloriesPer100g);
      case 'calories-asc':
        return list.sort((a, b) => a.caloriesPer100g - b.caloriesPer100g);
      case 'protein-desc':
        return list.sort((a, b) => b.proteinPer100g - a.proteinPer100g);
      case 'protein-asc':
        return list.sort((a, b) => a.proteinPer100g - b.proteinPer100g);
    }
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(
    () => sorted.slice((safePage - 1) * pageSize, safePage * pageSize),
    [sorted, safePage, pageSize],
  );

  const handleEdit = (ingredient: StoredIngredient) => {
    setEditingIngredient(ingredient);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingIngredient(null);
    setFormOpen(true);
  };

  const handleSave = (ingredient: StoredIngredient) => {
    onSave(ingredient);
  };

  const handleImport = async (input: ImportExternalIngredientInput): Promise<ImportExternalIngredientResult> => {
    const result = await importIngredient.mutateAsync(input);
    if (result.status === 'created') {
      toast.success(`"${result.ingredient.name}" imported.`);
    }
    return result;
  };

  const handleOpenIngredient = (ingredient: StoredIngredient) => {
    setImportOpen(false);
    setEditingIngredient(ingredient);
    setFormOpen(true);
  };

  const handleDelete = async (ingredient: StoredIngredient) => {
    if (await confirm('Delete ingredient', `Delete "${ingredient.name}"? This will remove it from any recipes using it.`)) {
      onDelete(ingredient.id);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {ingredients.length} {ingredients.length === 1 ? 'ingredient' : 'ingredients'}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {onRefresh && (
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={onRefresh} aria-label="Refresh">
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Database className="h-4 w-4 mr-1.5" />
            Import
          </Button>
          <Button onClick={handleCreate} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            New
          </Button>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search ingredients..."
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => {
          setCategoryFilter(v);
          setPage(1);
        }}>
          <SelectTrigger className="w-[130px] text-xs">
            {categoryFilter === 'all' ? 'All Categories' : categoryFilter}
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="none">Uncategorised</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={sort}
          onValueChange={(v) => {
            setSort(v as SortValue);
            localStorage.setItem(SORT_KEY, v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[140px] text-xs">
            {SORT_OPTIONS.find((o) => o.value === sort)?.label ?? 'Sort'}
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => setBarcodeOpen(true)}>
          <ScanBarcode className="mr-1.5 h-4 w-4" />
          Scan barcode
        </Button>
      </div>

      <Separator />

      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          {sorted.length} results
        </h3>

        {sorted.length === 0 ? (
          <div className="rounded-lg border border-dashed p-12 text-center">
            <Carrot className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">
              {ingredients.length === 0 ? 'No ingredients yet.' : 'No ingredients match your filters.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
              {paged.map((ing) => {
              const usage = getRecipeUsage(ing.name, recipes);
              return (
                <div
                  key={ing.id}
                  className="flex items-center gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/30 cursor-pointer"
                  onClick={() => handleEdit(ing)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-medium text-sm truncate">{ing.name}</span>
                      {(ing.source === 'usda' || ing.source === 'open-food-facts') && (
                        <Badge variant="outline" className="text-[10px] font-medium">
                          Imported from {SOURCE_LABELS[ing.source] || ing.source}
                        </Badge>
                      )}
                      <span className="text-[11px] text-muted-foreground">{ing.category || 'Uncategorised'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatCalories(ing.caloriesPer100g)} kcal</span>
                      <span>{formatNutrient(ing.proteinPer100g)}g P</span>
                      <span>{formatNutrient(ing.carbsPer100g)}g C</span>
                      <span>{formatNutrient(ing.fatPer100g)}g F</span>
                      {usage > 0 && (
                        <span className="text-muted-foreground/70">
                          · used in {usage} recipe{usage > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); handleEdit(ing); }}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={(e) => { e.stopPropagation(); handleDelete(ing); }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Delete</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <Pagination
          totalItems={sorted.length}
          page={safePage}
          totalPages={totalPages}
          pageSize={pageSize}
          pageSizeOptions={[5, 10, 20, 50]}
          onPageChange={setPage}
          onPageSizeChange={(n) => {
            setPageSize(n);
            localStorage.setItem(PAGE_SIZE_KEY, String(n));
            setPage(1);
          }}
        />
      </div>

      <IngredientFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        ingredient={editingIngredient}
        onSave={handleSave}
      />

      <ExternalFoodSearchDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        ingredients={ingredients}
        onImport={handleImport}
        onOpenIngredient={handleOpenIngredient}
      />
      <BarcodeImportDialog
        open={barcodeOpen}
        onOpenChange={setBarcodeOpen}
        ingredients={ingredients}
        onImport={handleImport}
        onOpenIngredient={handleOpenIngredient}
        onSaveIngredient={handleSave}
      />
      {dialog}
    </div>
  );
}
