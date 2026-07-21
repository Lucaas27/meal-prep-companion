import { useState, useCallback, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import RecipeLibrary from '@/features/recipes/components/RecipeLibrary';
import RecipeSheet from '@/features/recipes/components/RecipeSheet';
import DryCookedCalculator from '@/features/dry-to-cooked/components/DryCookedCalculator';
import IngredientCatalogue from '@/features/ingredients/components/IngredientCatalogue';
import SettingsPage from '@/features/settings/pages/settings-page';
import PlannerPage from '@/features/planner/pages/planner-page';
import NotFoundPage from '@/app/pages/not-found-page';
import SignInPage from '@/features/auth/pages/sign-in-page';
import { ProtectedRoute } from '@/app/components/ProtectedRoute';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';

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
    <AppShell>
      <ErrorBoundary>
      <Routes>
        <Route path="/" element={<Navigate to="/recipes" replace />} />
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
    </AppShell>
  );
}
