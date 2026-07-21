import { useState, useCallback } from 'react';
import type { Ingredient, Recipe } from '../types';
import { calcBatchTotals, calcPerPortion, round1dp } from '../utils/calculations';
import { loadRecipes, saveRecipes } from '../utils/storage';
import IngredientRow from './IngredientRow';

function makeId(): string {
  return crypto.randomUUID();
}

function makeIngredient(overrides: Partial<Ingredient> = {}): Ingredient {
  return {
    id: makeId(),
    name: '',
    weight: 0,
    caloriesPer100g: 0,
    proteinPer100g: 0,
    ...overrides,
  };
}

const STARTERS: Ingredient[] = [
  makeIngredient({ name: 'Chicken breast', weight: 200, caloriesPer100g: 165, proteinPer100g: 31 }),
  makeIngredient({ name: 'Lean pork mince', weight: 200, caloriesPer100g: 135, proteinPer100g: 21 }),
  makeIngredient({ name: 'Dry basmati rice', weight: 200, caloriesPer100g: 355, proteinPer100g: 8 }),
  makeIngredient({ name: 'Potatoes', weight: 300, caloriesPer100g: 77, proteinPer100g: 2 }),
  makeIngredient({ name: 'Eggs', weight: 200, caloriesPer100g: 140, proteinPer100g: 12 }),
  makeIngredient({ name: 'Cottage cheese', weight: 200, caloriesPer100g: 98, proteinPer100g: 11 }),
];

interface Props {
  editRecipe?: Recipe;
  onSaved?: () => void;
}

export default function BatchRecipeCalculator({ editRecipe, onSaved }: Props) {
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    editRecipe ? editRecipe.ingredients : STARTERS,
  );
  const [portions, setPortions] = useState(editRecipe ? editRecipe.portions : 4);
  const [name, setName] = useState(editRecipe ? editRecipe.name : '');
  const [savedMsg, setSavedMsg] = useState('');

  const validIngredients = ingredients.filter(
    (i) => i.weight > 0 && i.caloriesPer100g > 0 && i.proteinPer100g > 0,
  );

  const totals = calcBatchTotals(validIngredients);
  const hasDivisionError = portions <= 0;
  const perPortion = hasDivisionError
    ? null
    : calcPerPortion(totals, portions);

  const validationErrors: string[] = [];
  if (ingredients.length === 0) {
    validationErrors.push('Add at least one ingredient.');
  }
  if (portions <= 0) {
    validationErrors.push('Portions must be at least 1.');
  }
  for (const ing of ingredients) {
    if (ing.weight < 0) validationErrors.push(`"${ing.name || 'Ingredient'}" weight cannot be negative.`);
    if (ing.caloriesPer100g < 0) validationErrors.push(`"${ing.name || 'Ingredient'}" calories cannot be negative.`);
    if (ing.proteinPer100g < 0) validationErrors.push(`"${ing.name || 'Ingredient'}" protein cannot be negative.`);
  }

  const updateIngredient = useCallback((updated: Ingredient) => {
    setIngredients((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }, []);

  const removeIngredient = useCallback((id: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const addIngredient = () => {
    setIngredients((prev) => [...prev, makeIngredient()]);
  };

  const canSave = name.trim().length > 0 && portions > 0 && validIngredients.length > 0;

  const saveRecipe = () => {
    if (!canSave) return;
    const recipes = loadRecipes();
    const recipe: Recipe = {
      id: editRecipe?.id ?? makeId(),
      name: name.trim(),
      portions,
      ingredients,
      createdAt: editRecipe?.createdAt ?? Date.now(),
    };

    if (editRecipe) {
      const idx = recipes.findIndex((r) => r.id === editRecipe.id);
      if (idx >= 0) recipes[idx] = recipe;
      else recipes.push(recipe);
    } else {
      recipes.push(recipe);
    }

    saveRecipes(recipes);
    setSavedMsg(editRecipe ? 'Recipe updated!' : 'Recipe saved!');
    setTimeout(() => setSavedMsg(''), 2000);
    onSaved?.();
  };

  return (
    <section className="tab-content" aria-label="Batch recipe calculator">
      <h2>Batch Recipe Calculator</h2>
      <p className="tab-desc">
        Add ingredients, set portions, and calculate nutritional totals for your batch-cooked meal.
        Starter examples are provided — edit or remove them as needed.
      </p>

      <div className="card">
        <div className="name-row">
          <label className="field" htmlFor="recipe-name">
            <span className="field-label">Recipe name</span>
            <input
              id="recipe-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Chicken & rice meal prep"
              className="input"
            />
          </label>
          <label className="field field-portions" htmlFor="recipe-portions">
            <span className="field-label">Portions</span>
            <input
              id="recipe-portions"
              type="number"
              value={portions || ''}
              onChange={(e) => setPortions(Number(e.target.value))}
              min="1"
              step="1"
              className="input"
            />
          </label>
        </div>

        {ingredients.length === 0 ? (
          <div className="empty-state">
            <p>No ingredients yet. Add your first ingredient below.</p>
            <button type="button" className="btn-primary" onClick={addIngredient}>
              Add ingredient
            </button>
          </div>
        ) : (
          <>
            <div className="ingredient-list">
              {ingredients.map((ing) => (
                <IngredientRow
                  key={ing.id}
                  ingredient={ing}
                  onChange={updateIngredient}
                  onDelete={() => removeIngredient(ing.id)}
                />
              ))}
            </div>

            <button type="button" className="btn-secondary" onClick={addIngredient}>
              + Add ingredient
            </button>
          </>
        )}
      </div>

      {validationErrors.length > 0 && (
        <div className="errors" role="alert">
          {validationErrors.map((e, i) => (
            <p key={i} className="error-msg">{e}</p>
          ))}
        </div>
      )}

      {validIngredients.length > 0 && (
        <div className="summary-card">
          <h3>Batch Totals</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-value">{round1dp(totals.totalWeight)}g</span>
              <span className="summary-label">Total weight</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">{round1dp(totals.totalCalories)} kcal</span>
              <span className="summary-label">Total calories</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">{round1dp(totals.totalProtein)}g</span>
              <span className="summary-label">Total protein</span>
            </div>
          </div>

          {perPortion && (
            <>
              <h3>Per Portion ({portions} portions)</h3>
              <div className="summary-grid summary-grid--per-portion">
                <div className="summary-item summary-item--highlight">
                  <span className="summary-value summary-value--large">
                    {round1dp(perPortion.caloriesPerPortion)} kcal
                  </span>
                  <span className="summary-label">Calories per portion</span>
                </div>
                <div className="summary-item summary-item--highlight">
                  <span className="summary-value summary-value--large">
                    {round1dp(perPortion.proteinPerPortion)}g
                  </span>
                  <span className="summary-label">Protein per portion</span>
                </div>
                <div className="summary-item">
                  <span className="summary-value">{round1dp(perPortion.weightPerPortion)}g</span>
                  <span className="summary-label">Weight per portion</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div className="action-row">
        <button
          type="button"
          className="btn-primary"
          disabled={!canSave}
          onClick={saveRecipe}
        >
          {editRecipe ? 'Update recipe' : 'Save recipe'}
        </button>
        {savedMsg && <span className="saved-msg" aria-live="polite">{savedMsg}</span>}
      </div>
    </section>
  );
}
