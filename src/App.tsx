import { useState, useCallback } from 'react';
import type { Recipe } from '@/features/recipes/schemas/recipe.schema';
import { useRecipes, useCreateRecipe, useDeleteRecipe, useDuplicateRecipe } from '@/features/recipes/hooks';
import { useIngredients, useCreateIngredient, useDeleteIngredient } from '@/features/ingredients/hooks';
import { AppLayout } from '@/app/layout/app-layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import RecipeLibrary from '@/features/recipes/components/RecipeLibrary';
import RecipeSheet from '@/features/recipes/components/RecipeSheet';
import DryCookedCalculator from '@/features/dry-to-cooked/components/DryCookedCalculator';
import IngredientCatalogue from '@/features/ingredients/components/IngredientCatalogue';

export default function App() {
  const { data: recipes = [] } = useRecipes();
  const { data: storedIngredients = [] } = useIngredients();

  const saveRecipe = useCreateRecipe();
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
      <Tabs defaultValue="recipes" className="space-y-4">
        <TabsList className="w-full">
          <TabsTrigger value="recipes" className="flex-1">Recipes</TabsTrigger>
          <TabsTrigger value="calculator" className="flex-1">Calculator</TabsTrigger>
          <TabsTrigger value="catalogue" className="flex-1">Catalogue</TabsTrigger>
        </TabsList>

        <TabsContent value="recipes">
          <RecipeLibrary
            recipes={recipes}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onDelete={handleDeleteRecipe}
            onNew={handleNew}
          />
        </TabsContent>

        <TabsContent value="calculator">
          <DryCookedCalculator />
        </TabsContent>

        <TabsContent value="catalogue">
          <IngredientCatalogue
            ingredients={storedIngredients}
            onSave={handleSaveIngredient}
            onDelete={handleDeleteIngredient}
          />
        </TabsContent>
      </Tabs>

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
