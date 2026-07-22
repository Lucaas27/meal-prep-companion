import type { Recipe, Ingredient } from '@/features/recipes/schemas/recipe.schema';
import type { Database } from '@/infrastructure/supabase/database.types';

type RecipeRow = Database['public']['Tables']['recipes']['Row'];
type RecipeIngredientRow = Database['public']['Tables']['recipe_ingredients']['Row'];
type IngredientRow = Database['public']['Tables']['ingredients']['Row'];

interface JoinedIngredient {
  riRow: RecipeIngredientRow;
  ingRow: IngredientRow | null;
}

export function mapRecipeRows(
  recipeRows: RecipeRow[],
  riRows: RecipeIngredientRow[],
  ingredientRows: IngredientRow[],
): Recipe[] {
  const ingredientsByRid = new Map<string, JoinedIngredient[]>();
  for (const ri of riRows) {
    const ingRow = ri.ingredient_id
      ? ingredientRows.find((i) => i.id === ri.ingredient_id) || null
      : null;
    const list = ingredientsByRid.get(ri.recipe_id) || [];
    list.push({ riRow: ri, ingRow });
    ingredientsByRid.set(ri.recipe_id, list);
  }

  return recipeRows.map((row) => {
    const joined = (ingredientsByRid.get(row.id) || []).sort((a, b) => a.riRow.position - b.riRow.position);
    const ingredients: Ingredient[] = joined.map((j) => ({
      id: j.ingRow?.id || j.riRow.id,
      name: j.ingRow?.name || 'Unknown',
      weight: j.riRow.quantity,
      unit: j.riRow.unit || 'g',
      unitConversionId: j.riRow.ingredient_unit_conversion_id,
      caloriesPer100g: j.ingRow?.calories_per_100g || 0,
      proteinPer100g: j.ingRow?.protein_per_100g || 0,
      carbsPer100g: j.ingRow?.carbs_per_100g || 0,
      fatPer100g: j.ingRow?.fat_per_100g || 0,
    }));

    return {
      id: row.id,
      name: row.name,
      portions: row.portions,
      ingredients,
      createdAt: new Date(row.created_at).getTime(),
      updatedAt: new Date(row.updated_at).getTime(),
      tags: row.tags || [],
      favourite: row.favourite,
      notes: row.notes || '',
    };
  });
}

export function recipeToRow(recipe: Recipe, userId: string): Database['public']['Tables']['recipes']['Insert'] {
  return {
    id: recipe.id,
    user_id: userId,
    name: recipe.name,
    portions: recipe.portions,
    notes: recipe.notes,
    tags: recipe.tags.length > 0 ? recipe.tags : [],
    favourite: recipe.favourite,
  };
}
