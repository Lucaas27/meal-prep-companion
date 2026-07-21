import { useState, useEffect } from 'react';
import type { Recipe } from '../types';
import { calcBatchTotals, calcPerPortion, round1dp } from '../utils/calculations';
import { loadRecipes, saveRecipes } from '../utils/storage';

interface Props {
  onEdit: (recipe: Recipe) => void;
}

export default function SavedMeals({ onEdit }: Props) {
  const [recipes, setRecipes] = useState<Recipe[]>(loadRecipes);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    setRecipes(loadRecipes());
  }, []);

  const refresh = () => setRecipes(loadRecipes());

  const handleDelete = (id: string) => {
    const updated = recipes.filter((r) => r.id !== id);
    saveRecipes(updated);
    setRecipes(updated);
    setConfirmDelete(null);
  };

  const handleDuplicate = (recipe: Recipe) => {
    const dup: Recipe = {
      ...recipe,
      id: crypto.randomUUID(),
      name: `${recipe.name} (copy)`,
      createdAt: Date.now(),
      ingredients: recipe.ingredients.map((ing) => ({ ...ing, id: crypto.randomUUID() })),
    };
    const updated = [...recipes, dup];
    saveRecipes(updated);
    setRecipes(updated);
  };

  const getStats = (recipe: Recipe) => {
    const valid = recipe.ingredients.filter(
      (i) => i.weight > 0 && i.caloriesPer100g > 0 && i.proteinPer100g > 0,
    );
    const totals = calcBatchTotals(valid);
    const per = recipe.portions > 0 ? calcPerPortion(totals, recipe.portions) : null;
    return { totals, per };
  };

  return (
    <section className="tab-content" aria-label="Saved meals">
      <h2>Saved Meals</h2>
      <p className="tab-desc">
        Recipes saved in your browser's local storage. Load a recipe to edit it, duplicate it, or delete it.
      </p>

      <button type="button" className="btn-secondary" onClick={refresh}>
        Refresh list
      </button>

      {recipes.length === 0 ? (
        <div className="empty-state">
          <p>No saved recipes yet. Use the Batch Recipe Calculator to create and save one.</p>
        </div>
      ) : (
        <div className="saved-list">
          {recipes.map((recipe) => {
            const { per } = getStats(recipe);
            return (
              <div key={recipe.id} className="card saved-card">
                <div className="saved-card-header">
                  <h3 className="saved-name">{recipe.name}</h3>
                  <span className="saved-portions">{recipe.portions} portions</span>
                </div>

                {per && (
                  <div className="saved-stats">
                    <div className="saved-stat">
                      <span className="saved-stat-value">{round1dp(per.caloriesPerPortion)} kcal</span>
                      <span className="saved-stat-label">per portion</span>
                    </div>
                    <div className="saved-stat">
                      <span className="saved-stat-value">{round1dp(per.proteinPerPortion)}g</span>
                      <span className="saved-stat-label">protein</span>
                    </div>
                    <div className="saved-stat">
                      <span className="saved-stat-value">{round1dp(per.weightPerPortion)}g</span>
                      <span className="saved-stat-label">weight</span>
                    </div>
                  </div>
                )}

                <div className="saved-ingredients">
                  {recipe.ingredients.map((ing) => (
                    <span key={ing.id} className="saved-ingredient-tag">
                      {ing.name} ({ing.weight}g)
                    </span>
                  ))}
                </div>

                <div className="saved-actions">
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => onEdit(recipe)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => handleDuplicate(recipe)}
                  >
                    Duplicate
                  </button>
                  {confirmDelete === recipe.id ? (
                    <span className="confirm-delete">
                      <span>Delete?</span>
                      <button
                        type="button"
                        className="btn-danger btn-sm"
                        onClick={() => handleDelete(recipe.id)}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        className="btn-secondary btn-sm"
                        onClick={() => setConfirmDelete(null)}
                      >
                        No
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="btn-danger btn-sm"
                      onClick={() => setConfirmDelete(recipe.id)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
