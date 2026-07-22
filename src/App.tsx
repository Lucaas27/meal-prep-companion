import { useState, useCallback, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import type { Recipe } from '@/features/recipes/schemas/recipe.schema';
import {
  useRecipes,
  useCreateRecipe,
  useUpdateRecipe,
  useDeleteRecipe,
  useDuplicateRecipe,
} from '@/features/recipes/hooks';
import { useIngredients, useCreateIngredient, useDeleteIngredient } from '@/features/ingredients/hooks';
import { AppShell } from '@/app/layout/app-layout';
import { toast } from 'sonner';
import { useConfirm } from '@/shared/components/ConfirmDialog';
import RecipeLibrary from '@/features/recipes/components/RecipeLibrary';
import RecipeSheet from '@/features/recipes/components/RecipeSheet';
import DryCookedCalculator from '@/features/dry-to-cooked/components/DryCookedCalculator';
import IngredientCatalogue from '@/features/ingredients/components/IngredientCatalogue';
import SettingsPage from '@/features/settings/pages/settings-page';
import PlannerPage from '@/features/planner/pages/planner-page';
import NotFoundPage from '@/app/pages/not-found-page';
import SignInPage from '@/features/auth/pages/sign-in-page';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { RootRoute } from '@/app/components/RootRoute';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';
import { MigrationPrompt } from '@/features/migration/components/MigrationPrompt';

export default function App() {
  const { data: recipes = [] } = useRecipes();
  const { data: storedIngredients = [] } = useIngredients();
  const location = useLocation();

  useEffect(() => {
    const titles: Record<string, string> = {
      '/': 'Home',
      '/recipes': 'Recipes',
      '/calculator': 'Calculator',
      '/ingredients': 'Catalogue',
      '/planner': 'Planner',
      '/settings': 'Settings',
      '/sign-in': 'Sign In',
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
        onSuccess: () => {
          toast.success(editingRecipe ? 'Recipe updated!' : 'Recipe saved!');
          setSheetOpen(false);
        },
        onError: (err) => toast.error(String(err)),
      });
    },
    [saveRecipe, editingRecipe],
  );

  const handleToggleFavourite = useCallback(
    (recipe: Recipe) => {
      updateRecipe.mutate(
        { ...recipe, favourite: !recipe.favourite },
        { onError: (err) => toast.error(String(err)) },
      );
    },
    [updateRecipe],
  );

  const handleDuplicate = useCallback(
    (recipe: Recipe) => {
      duplicateRecipe.mutate(recipe, {
        onSuccess: () => toast.success('Recipe duplicated!'),
        onError: (err) => toast.error(String(err)),
      });
    },
    [duplicateRecipe],
  );

  const { confirm, dialog } = useConfirm();

  const handleDeleteRecipe = useCallback(
    async (id: string) => {
      if (await confirm('Delete recipe', 'Delete this recipe?')) {
        deleteRecipe.mutate(id, {
          onSuccess: () => toast.success('Recipe deleted!'),
          onError: (err) => toast.error(String(err)),
        });
      }
    },
    [deleteRecipe, confirm],
  );

  const handleBulkDeleteRecipes = useCallback(
    (ids: string[]) => {
      ids.forEach((id) => deleteRecipe.mutate(id, { onError: (err) => toast.error(String(err)) }));
      toast.success(`${ids.length} recipe${ids.length > 1 ? 's' : ''} deleted!`);
    },
    [deleteRecipe],
  );

  const handleSaveIngredient = useCallback(
    (ing: Parameters<typeof saveIngredient.mutate>[0]) => {
      saveIngredient.mutate(ing, {
        onSuccess: () => toast.success('Ingredient added!'),
        onError: (err) => toast.error(String(err)),
      });
    },
    [saveIngredient],
  );

  const handleDeleteIngredient = useCallback(
    (id: string) => {
      deleteIngredient.mutate(id, { onError: (err) => toast.error(String(err)) });
    },
    [deleteIngredient],
  );

  return (
    <AppShell>
      <MigrationPrompt />
      <ErrorBoundary>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route
          path="/recipes"
          element={
            <ProtectedRoute>
              <RecipeLibrary
                recipes={recipes}
                onEdit={handleEdit}
                onDuplicate={handleDuplicate}
                onDelete={handleDeleteRecipe}
                onBulkDelete={handleBulkDeleteRecipes}
                onToggleFavourite={handleToggleFavourite}
                onNew={handleNew}
              />
            </ProtectedRoute>
          }
        />
        <Route path="/planner" element={<ProtectedRoute><PlannerPage /></ProtectedRoute>} />
        <Route path="/calculator" element={<ProtectedRoute><DryCookedCalculator /></ProtectedRoute>} />
        <Route
          path="/ingredients"
          element={
            <ProtectedRoute>
              <IngredientCatalogue
                ingredients={storedIngredients}
                onSave={handleSaveIngredient}
                onDelete={handleDeleteIngredient}
              />
            </ProtectedRoute>
          }
        />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </ErrorBoundary>

      <RecipeSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        recipe={editingRecipe}
        onSave={handleSave}
        storedIngredients={storedIngredients}
      />
      {dialog}
    </AppShell>
  );
}
