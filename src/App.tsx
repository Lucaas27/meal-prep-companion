import { useState } from 'react';
import type { Tab, Recipe } from './types';
import BatchRecipeCalculator from './components/BatchRecipeCalculator';
import CookedRiceCalculator from './components/CookedRiceCalculator';
import SavedMeals from './components/SavedMeals';

const TABS: { id: Tab; label: string }[] = [
  { id: 'batch', label: 'Batch Recipe' },
  { id: 'rice', label: 'Cooked Rice' },
  { id: 'saved', label: 'Saved Meals' },
];

export default function App() {
  const [tab, setTab] = useState<Tab>('batch');
  const [editRecipe, setEditRecipe] = useState<Recipe | undefined>(undefined);

  const handleEdit = (recipe: Recipe) => {
    setEditRecipe(recipe);
    setTab('batch');
  };

  const handleSaved = () => {
    setEditRecipe(undefined);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Meal Prep Calculator</h1>
        <p className="tagline">Plan your batch cooking with precise nutrition</p>
      </header>

      <nav className="tabs" role="tablist" aria-label="Calculator sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`tab ${tab === t.id ? 'tab--active' : ''}`}
            onClick={() => {
              setTab(t.id);
              if (t.id !== 'batch') setEditRecipe(undefined);
            }}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="main">
        {tab === 'batch' && (
          <BatchRecipeCalculator
            key={editRecipe?.id ?? 'new'}
            editRecipe={editRecipe}
            onSaved={handleSaved}
          />
        )}
        {tab === 'rice' && <CookedRiceCalculator />}
        {tab === 'saved' && <SavedMeals onEdit={handleEdit} />}
      </main>
    </div>
  );
}
