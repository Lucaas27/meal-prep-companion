import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Routes, Route, useLocation, useNavigate, useParams } from 'react-router-dom';
import type { Recipe } from '@/features/recipes/schemas/recipe.schema';
import type { StoredIngredient } from '@/features/ingredients/schemas/ingredient.schema';
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
import RecipeEditorPage from '@/features/recipes/components/RecipeSheet';
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
import { queryKeys } from '@/shared/constants/query-keys';

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

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const refreshRecipes = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.recipes.all });
  }, [queryClient]);

  const refreshIngredients = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.ingredients.all });
  }, [queryClient]);

  const handleNew = useCallback(() => {
    navigate('/recipes/new');
  }, [navigate]);

  const handleEdit = useCallback((recipe: Recipe) => {
    navigate(`/recipes/${recipe.id}/edit`);
  }, [navigate]);

  const handleSave = useCallback(
    (recipe: Recipe) => {
      saveRecipe.mutate(recipe, {
        onSuccess: () => {
          toast.success('Recipe saved!');
          navigate('/recipes');
        },
        onError: (err) => toast.error(String(err)),
      });
    },
    [saveRecipe, navigate],
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
                onRefresh={refreshRecipes}
              />
            </ProtectedRoute>
          }
        />
        <Route path="/planner" element={<ProtectedRoute><PlannerPage /></ProtectedRoute>} />
        <Route path="/recipes/new" element={<ProtectedRoute><RecipeEditorPage recipe={null} onSave={handleSave} storedIngredients={storedIngredients} /></ProtectedRoute>} />
        <Route path="/recipes/:id/edit" element={<ProtectedRoute><EditRecipeWrapper recipes={recipes} onSave={handleSave} storedIngredients={storedIngredients} /></ProtectedRoute>} />
        <Route path="/calculator" element={<ProtectedRoute><DryCookedCalculator /></ProtectedRoute>} />
        <Route
          path="/ingredients"
          element={
            <ProtectedRoute>
              <IngredientCatalogue
                ingredients={storedIngredients}
                onSave={handleSaveIngredient}
                onDelete={handleDeleteIngredient}
                onRefresh={refreshIngredients}
              />
            </ProtectedRoute>
          }
        />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </ErrorBoundary>
      {dialog}
    </AppShell>
  );
}

function EditRecipeWrapper({ recipes, onSave, storedIngredients }: { recipes: Recipe[]; onSave: (r: Recipe) => void; storedIngredients: StoredIngredient[] }) {
  const { id } = useParams();
  const recipe = recipes.find((r) => r.id === id) ?? null;
  return <RecipeEditorPage recipe={recipe} onSave={onSave} storedIngredients={storedIngredients} />;
}
