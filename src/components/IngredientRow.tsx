import type { Ingredient } from '../types';
import { round1dp } from '../utils/calculations';

interface Props {
  ingredient: Ingredient;
  onChange: (ingredient: Ingredient) => void;
  onDelete: () => void;
}

export default function IngredientRow({ ingredient, onChange, onDelete }: Props) {
  const handleChange = (field: keyof Ingredient, value: string) => {
    onChange({ ...ingredient, [field]: field === 'name' ? value : Number(value) });
  };

  const weight = ingredient.weight || 0;
  const cal = ingredient.caloriesPer100g || 0;
  const prot = ingredient.proteinPer100g || 0;
  const totalCal = weight > 0 && cal > 0 ? round1dp((weight / 100) * cal) : 0;
  const totalProt = weight > 0 && prot > 0 ? round1dp((weight / 100) * prot) : 0;

  return (
    <div className="ingredient-row">
      <div className="ingredient-fields">
        <label className="field field-name">
          <span className="field-label">Ingredient</span>
          <input
            type="text"
            value={ingredient.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="e.g. Chicken breast"
            className="input"
          />
        </label>
        <label className="field field-weight">
          <span className="field-label">Weight (g)</span>
          <input
            type="number"
            value={ingredient.weight || ''}
            onChange={(e) => handleChange('weight', e.target.value)}
            placeholder="200"
            min="0"
            step="1"
            className="input"
          />
        </label>
        <label className="field field-cal">
          <span className="field-label">Cal / 100g</span>
          <input
            type="number"
            value={ingredient.caloriesPer100g || ''}
            onChange={(e) => handleChange('caloriesPer100g', e.target.value)}
            placeholder="165"
            min="0"
            step="0.1"
            className="input"
          />
        </label>
        <label className="field field-prot">
          <span className="field-label">Protein / 100g</span>
          <input
            type="number"
            value={ingredient.proteinPer100g || ''}
            onChange={(e) => handleChange('proteinPer100g', e.target.value)}
            placeholder="31"
            min="0"
            step="0.1"
            className="input"
          />
        </label>
      </div>

      <div className="ingredient-result" aria-live="polite">
        <span className="result-chip">{totalCal} kcal</span>
        <span className="result-chip">{totalProt}g protein</span>
      </div>

      <button
        type="button"
        className="btn-delete"
        onClick={onDelete}
        aria-label={`Remove ${ingredient.name || 'ingredient'}`}
      >
        Delete
      </button>
    </div>
  );
}
