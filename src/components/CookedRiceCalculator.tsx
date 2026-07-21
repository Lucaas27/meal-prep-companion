import { useState } from 'react';
import { calcRiceTotals, calcRicePer100g, calcRicePerPortion, round1dp } from '../utils/calculations';
import type { RiceInputs } from '../types';

export default function CookedRiceCalculator() {
  const [inputs, setInputs] = useState<RiceInputs>({
    dryWeight: 200,
    dryCaloriesPer100g: 355,
    dryProteinPer100g: 8,
    cookedWeight: 460,
    portions: 4,
  });

  const handleChange = (field: keyof RiceInputs, value: string) => {
    setInputs((prev) => ({ ...prev, [field]: Number(value) }));
  };

  const errors: string[] = [];
  if (inputs.dryWeight <= 0) errors.push('Dry weight must be greater than 0.');
  if (inputs.dryCaloriesPer100g <= 0) errors.push('Calories per 100g dry must be greater than 0.');
  if (inputs.dryProteinPer100g < 0) errors.push('Protein per 100g dry cannot be negative.');
  if (inputs.cookedWeight <= 0) errors.push('Cooked weight must be greater than 0.');
  if (inputs.portions <= 0) errors.push('Portions must be at least 1.');

  const hasError = errors.length > 0;

  const totals = hasError ? null : calcRiceTotals(inputs);
  const per100g = totals && inputs.cookedWeight > 0
    ? calcRicePer100g(totals, inputs.cookedWeight)
    : null;
  const perPortion = totals && inputs.portions > 0
    ? calcRicePerPortion(totals, inputs.cookedWeight, inputs.portions)
    : null;

  return (
    <section className="tab-content" aria-label="Cooked rice calculator">
      <h2>Cooked Rice Calculator</h2>
      <p className="tab-desc">
        Enter the dry rice details and the final cooked weight to work out
        nutritional values per 100g of cooked rice and per portion.
      </p>

      <div className="card">
        <div className="fields-grid">
          <label className="field" htmlFor="rice-dry-weight">
            <span className="field-label">Dry rice weight (g)</span>
            <input
              id="rice-dry-weight"
              type="number"
              value={inputs.dryWeight || ''}
              onChange={(e) => handleChange('dryWeight', e.target.value)}
              min="0"
              step="1"
              className="input"
            />
          </label>
          <label className="field" htmlFor="rice-cal">
            <span className="field-label">Calories per 100g dry</span>
            <input
              id="rice-cal"
              type="number"
              value={inputs.dryCaloriesPer100g || ''}
              onChange={(e) => handleChange('dryCaloriesPer100g', e.target.value)}
              min="0"
              step="0.1"
              className="input"
            />
          </label>
          <label className="field" htmlFor="rice-prot">
            <span className="field-label">Protein per 100g dry</span>
            <input
              id="rice-prot"
              type="number"
              value={inputs.dryProteinPer100g || ''}
              onChange={(e) => handleChange('dryProteinPer100g', e.target.value)}
              min="0"
              step="0.1"
              className="input"
            />
          </label>
          <label className="field" htmlFor="rice-cooked">
            <span className="field-label">Cooked batch weight (g)</span>
            <input
              id="rice-cooked"
              type="number"
              value={inputs.cookedWeight || ''}
              onChange={(e) => handleChange('cookedWeight', e.target.value)}
              min="0"
              step="1"
              className="input"
            />
          </label>
          <label className="field" htmlFor="rice-portions">
            <span className="field-label">Portions</span>
            <input
              id="rice-portions"
              type="number"
              value={inputs.portions || ''}
              onChange={(e) => handleChange('portions', e.target.value)}
              min="1"
              step="1"
              className="input"
            />
          </label>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="errors" role="alert">
          {errors.map((e, i) => (
            <p key={i} className="error-msg">{e}</p>
          ))}
        </div>
      )}

      {totals && (
        <div className="summary-card">
          <h3>Batch Totals</h3>
          <div className="summary-grid">
            <div className="summary-item">
              <span className="summary-value">{round1dp(totals.totalCalories)} kcal</span>
              <span className="summary-label">Total calories</span>
            </div>
            <div className="summary-item">
              <span className="summary-value">{round1dp(totals.totalProtein)}g</span>
              <span className="summary-label">Total protein</span>
            </div>
          </div>

          {per100g && (
            <>
              <h3>Per 100g Cooked</h3>
              <div className="summary-grid">
                <div className="summary-item">
                  <span className="summary-value">{round1dp(per100g.caloriesPer100gCooked)} kcal</span>
                  <span className="summary-label">Calories</span>
                </div>
                <div className="summary-item">
                  <span className="summary-value">{round1dp(per100g.proteinPer100gCooked)}g</span>
                  <span className="summary-label">Protein</span>
                </div>
              </div>
            </>
          )}

          {perPortion && (
            <>
              <h3>Per Portion ({inputs.portions} portions)</h3>
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
                  <span className="summary-value">{round1dp(perPortion.gramsPerPortion)}g</span>
                  <span className="summary-label">Cooked weight per portion</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <div className="info-box">
        <p>
          Cooking rice adds water weight. The dry rice determines the total
          calories and protein — cooking does not change these values. The
          final cooked weight is only needed to work out the values per 100g
          of cooked rice and per portion.
        </p>
      </div>
    </section>
  );
}
