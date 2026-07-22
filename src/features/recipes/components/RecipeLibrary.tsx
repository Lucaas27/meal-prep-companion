import { useState, useMemo, useCallback } from 'react';
import type { Recipe } from '../schemas/recipe.schema';
import { calcBatchTotals } from '../utils/calculations';
import { round1dp } from '@/shared/utils/format';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select';
import {
  Search,
  Plus,
  ChefHat,
  LayoutGrid,
  List,
  Trash2,
} from 'lucide-react';
import { RecipeGridView } from './RecipeGridView';
import { RecipeListView } from './RecipeListView';
import { Pagination } from '@/shared/components/Pagination';
import { useConfirm } from '@/shared/components/ConfirmDialog';

function loadPageSize(): number {
  const saved = localStorage.getItem(PAGE_SIZE_KEY);
  const n = Number(saved);
  return PAGE_SIZE_OPTIONS.includes(n as typeof PAGE_SIZE_OPTIONS[number]) ? n : 10;
}

function savePageSize(value: number) {
  localStorage.setItem(PAGE_SIZE_KEY, String(value));
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50] as const;

const SORT_KEY = 'recipe-library-sort';
const VIEW_KEY = 'recipe-library-view';
const PAGE_SIZE_KEY = 'recipe-library-page-size';

const SORT_OPTIONS = [
  { value: 'recent', label: 'Recently Updated' },
  { value: 'created', label: 'Recently Created' },
  { value: 'name-asc', label: 'A–Z' },
  { value: 'name-desc', label: 'Z–A' },
  { value: 'calories-desc', label: 'Highest Calories' },
  { value: 'calories-asc', label: 'Lowest Calories' },
  { value: 'protein-desc', label: 'Highest Protein' },
  { value: 'protein-asc', label: 'Lowest Protein' },
  { value: 'favourites', label: 'Favourites List' },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]['value'];
type ViewMode = 'grid' | 'list';

function loadSort(): SortValue {
  const saved = localStorage.getItem(SORT_KEY);
  return SORT_OPTIONS.some((o) => o.value === saved) ? (saved as SortValue) : 'recent';
}

function saveSort(value: SortValue) {
  localStorage.setItem(SORT_KEY, value);
}

function loadView(): ViewMode {
  const saved = localStorage.getItem(VIEW_KEY);
  return saved === 'list' ? 'list' : 'grid';
}

function saveView(value: ViewMode) {
  localStorage.setItem(VIEW_KEY, value);
}

function sortRecipes(recipes: Recipe[], sort: SortValue): Recipe[] {
  const sorted = [...recipes];
  switch (sort) {
    case 'recent':
      return sorted.sort((a, b) => b.createdAt - a.createdAt);
    case 'created':
      return sorted.sort((a, b) => a.createdAt - b.createdAt);
    case 'name-asc':
      return sorted.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-desc':
      return sorted.sort((a, b) => b.name.localeCompare(a.name));
    case 'calories-desc':
      return sorted.sort((a, b) => getCalories(b) - getCalories(a));
    case 'calories-asc':
      return sorted.sort((a, b) => getCalories(a) - getCalories(b));
    case 'protein-desc':
      return sorted.sort((a, b) => getProtein(b) - getProtein(a));
    case 'protein-asc':
      return sorted.sort((a, b) => getProtein(a) - getProtein(b));
    case 'favourites':
      return sorted.sort((a, b) => (b.favourite ? 1 : 0) - (a.favourite ? 1 : 0));
  }
}

function getCalories(recipe: Recipe): number {
  const valid = recipe.ingredients.filter((i) => i.weight > 0);
  const totals = calcBatchTotals(valid);
  return recipe.portions > 0 ? totals.totalCalories / recipe.portions : 0;
}

function getProtein(recipe: Recipe): number {
  const valid = recipe.ingredients.filter((i) => i.weight > 0);
  const totals = calcBatchTotals(valid);
  return recipe.portions > 0 ? totals.totalProtein / recipe.portions : 0;
}

interface Props {
  recipes: Recipe[];
  onEdit: (recipe: Recipe) => void;
  onDuplicate: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
  onBulkDelete?: (ids: string[]) => void;
  onToggleFavourite: (recipe: Recipe) => void;
  onNew: () => void;
}

export default function RecipeLibrary({
  recipes,
  onEdit,
  onDuplicate,
  onDelete,
  onBulkDelete,
  onToggleFavourite,
  onNew,
}: Props) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortValue>(loadSort);
  const [view, setView] = useState<ViewMode>(loadView);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(loadPageSize);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const { confirm, dialog } = useConfirm();

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const count = selectedIds.size;
    if (await confirm('Delete recipes', `Delete ${count} recipe${count > 1 ? 's' : ''}?`)) {
      if (onBulkDelete) {
        onBulkDelete(Array.from(selectedIds));
      } else {
        for (const id of selectedIds) onDelete(id);
      }
      setSelectedIds(new Set());
    }
  };

  const filtered = useMemo(() => {
    let list = recipes;
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        if (r.name.toLowerCase().includes(q)) return true;
        if (r.tags.some((t) => t.toLowerCase().includes(q))) return true;
        return r.ingredients.some((i) => i.name.toLowerCase().includes(q));
      });
    }
    if (sort === 'favourites') {
      list = list.filter((r) => r.favourite);
    }
    return list;
  }, [recipes, search, sort]);

  const sorted = useMemo(() => sortRecipes(filtered, sort), [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = useMemo(
    () => sorted.slice((page - 1) * pageSize, page * pageSize),
    [sorted, page, pageSize],
  );

  const allSelected = paged.length > 0 && paged.every((r) => selectedIds.has(r.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paged.map((r) => r.id)));
    }
  };

  const viewProps = { onEdit, onDuplicate, onDelete, onToggleFavourite, selectedIds, onToggleSelect: toggleSelect, allSelected, toggleSelectAll };

  const stats = useMemo(() => {
    const total = filtered.length;
    const favs = filtered.filter((r) => r.favourite).length;
    const avgCal =
      total > 0
        ? round1dp(filtered.reduce((sum, r) => sum + getCalories(r), 0) / total)
        : 0;
    const avgProtein =
      total > 0
        ? round1dp(filtered.reduce((sum, r) => sum + getProtein(r), 0) / total)
        : 0;
    return { total, favs, avgCal, avgProtein };
  }, [filtered]);

  const safePage = Math.min(page, totalPages);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex rounded-md border p-0.5">
            <Button
              variant={view === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8 min-h-0"
              onClick={() => {
                setView('grid');
                saveView('grid');
              }}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === 'list' ? 'default' : 'ghost'}
              size="icon"
              className="h-8 w-8 min-h-0"
              onClick={() => {
                setView('list');
                saveView('list');
              }}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={onNew} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            New
          </Button>
        </div>
      </div>

      {recipes.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="rounded-lg border bg-card p-3 text-center">
            <span className="block text-lg font-semibold tracking-tight">{stats.total}</span>
            <span className="block text-[10px] text-muted-foreground">Recipes</span>
          </div>
          <div className="rounded-lg border bg-card p-3 text-center">
            <span className="block text-lg font-semibold tracking-tight">{stats.favs}</span>
            <span className="block text-[10px] text-muted-foreground">Favourites</span>
          </div>
          <div className="rounded-lg border bg-card p-3 text-center">
            <span className="block text-lg font-semibold tracking-tight">{stats.avgCal}</span>
            <span className="block text-[10px] text-muted-foreground">Avg kcal</span>
          </div>
          <div className="rounded-lg border bg-card p-3 text-center">
            <span className="block text-lg font-semibold tracking-tight">{stats.avgProtein}g</span>
            <span className="block text-[10px] text-muted-foreground">Avg protein</span>
          </div>
        </div>
      )}

      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border bg-primary/5 p-3">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>Clear</Button>
          <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete
          </Button>
        </div>
      )}

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search recipes, ingredients, tags..."
            className="pl-9"
          />
        </div>
        <Select
          value={sort}
          onValueChange={(v) => {
            setSort(v as SortValue);
            saveSort(v as SortValue);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[150px] text-xs">
            {SORT_OPTIONS.find((o) => o.value === sort)?.label ?? 'Sort'}
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {recipes.length === 0 ? (
        <Card className="border-dashed">
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <ChefHat className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground text-sm mb-1 font-medium">No recipes yet</p>
            <p className="text-muted-foreground text-xs mb-4">
              Create your first recipe to get started.
            </p>
            <Button onClick={onNew}>
              <Plus className="h-4 w-4 mr-1.5" />
              Create Recipe
            </Button>
          </div>
        </Card>
      ) : sorted.length === 0 ? (
        <Card className="border-dashed">
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <p className="text-muted-foreground text-sm">No recipes match your search.</p>
          </div>
        </Card>
      ) : view === 'grid' ? (
        <RecipeGridView recipes={paged} {...viewProps} />
      ) : (
        <RecipeListView recipes={paged} {...viewProps} />
      )}

      <Pagination
        totalItems={sorted.length}
        page={safePage}
        totalPages={totalPages}
        pageSize={pageSize}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        onPageChange={setPage}
        onPageSizeChange={(n) => {
          setPageSize(n);
          savePageSize(n);
          setPage(1);
        }}
      />
      {dialog}
    </div>
  );
}
