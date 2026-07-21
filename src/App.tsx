import { useState, useCallback, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import type { Recipe } from '@/features/recipes/schemas/recipe.schema';
import {
  useRecipes,
  useCreateRecipe,
  useUpdateRecipe,
  useDeleteRecipe,
  useDuplicateRecipe,
} from '@/features/recipes/hooks';
import { useIngredients, useCreateIngredient, useDeleteIngredient } from '@/features/ingredients/hooks';
import { AppLayout } from '@/app/layout/app-layout';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import RecipeLibrary from '@/features/recipes/components/RecipeLibrary';
import RecipeSheet from '@/features/recipes/components/RecipeSheet';
import DryCookedCalculator from '@/features/dry-to-cooked/components/DryCookedCalculator';
import IngredientCatalogue from '@/features/ingredients/components/IngredientCatalogue';
import SettingsPage from '@/features/settings/pages/settings-page';
import PlannerPage from '@/features/planner/pages/planner-page';
import NotFoundPage from '@/app/pages/not-found-page';

const NAV_ITEMS = [
  { to: '/recipes', label: 'Recipes' },
  { to: '/planner', label: 'Planner' },
  { to: '/calculator', label: 'Calculator' },
  { to: '/ingredients', label: 'Catalogue' },
  { to: '/settings', label: 'Settings' },
];

export default function App() {
  const { data: recipes = [] } = useRecipes();
  const { data: storedIngredients = [] } = useIngredients();
  const location = useLocation();

  useEffect(() => {
    const titles: Record<string, string> = {
      '/recipes': 'Recipes',
      '/calculator': 'Calculator',
      '/ingredients': 'Catalogue',
      '/planner': 'Planner',
      '/settings': 'Settings',
    };
    const title = titles[location.pathname] || 'Not Found';
    document.title = `${title} | Meal Prep Companion`;
  }, [location.pathname]);

  const saveRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();
  const deleteRecipe = useDeleteRecipe();
  const duplicateRecipe = useDuplicateRecipe();
  const saveIngredient = useCreateIngredient();
  const deleteIngredient = useDeleteIngredient();

  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleNew = useCallback(() => {
    setEditingRecipe(null);
    setSheetOpen(true);
  }, []);

  const handleEdit = useCallback((recipe: Recipe) => {
    setEditingRecipe(recipe);
    setSheetOpen(true);
  }, []);

  const handleSave = useCallback(
    (recipe: Recipe) => {
      saveRecipe.mutate(recipe, {
        onSuccess: () => toast.success(editingRecipe ? 'Recipe updated!' : 'Recipe saved!'),
      });
    },
    [saveRecipe, editingRecipe],
  );

  const handleToggleFavourite = useCallback(
    (recipe: Recipe) => {
      updateRecipe.mutate({ ...recipe, favourite: !recipe.favourite });
    },
    [updateRecipe],
  );

  const handleDuplicate = useCallback(
    (recipe: Recipe) => {
      duplicateRecipe.mutate(recipe, {
        onSuccess: () => toast.success('Recipe duplicated!'),
      });
    },
    [duplicateRecipe],
  );

  const handleDeleteRecipe = useCallback(
    (id: string) => {
      if (confirm('Delete this recipe?')) {
        deleteRecipe.mutate(id, {
          onSuccess: () => toast.success('Recipe deleted!'),
        });
      }
    },
    [deleteRecipe],
  );

  const handleSaveIngredient = useCallback(
    (ing: Parameters<typeof saveIngredient.mutate>[0]) => {
      saveIngredient.mutate(ing, {
        onSuccess: () => toast.success('Ingredient added!'),
      });
    },
    [saveIngredient],
  );

  const handleDeleteIngredient = useCallback(
    (id: string) => {
      deleteIngredient.mutate(id);
    },
    [deleteIngredient],
  );

  return (
    <AppLayout>
      <nav className="flex items-center justify-center rounded-xl bg-muted p-1 mb-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 flex-1',
                isActive
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <Routes>
        <Route path="/" element={<Navigate to="/recipes" replace />} />
        <Route
          path="/recipes"
          element={
            <RecipeLibrary
              recipes={recipes}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDeleteRecipe}
              onToggleFavourite={handleToggleFavourite}
              onNew={handleNew}
            />
          }
        />
        <Route path="/planner" element={<PlannerPage />} />
        <Route path="/calculator" element={<DryCookedCalculator />} />
        <Route
          path="/ingredients"
          element={
            <IngredientCatalogue
              ingredients={storedIngredients}
              onSave={handleSaveIngredient}
              onDelete={handleDeleteIngredient}
            />
          }
        />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <RecipeSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        recipe={editingRecipe}
        onSave={handleSave}
        storedIngredients={storedIngredients}
      />
    </AppLayout>
  );
}
