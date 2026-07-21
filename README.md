# Meal Prep Calculator

A mobile-first, single-page app for calculating nutritional values of batch-cooked meals. Built with Vite, React, and TypeScript. Works entirely locally — no backend or database.

## Setup

```bash
npm install
npm run dev      # start dev server
npm run build    # production build
npm test         # run unit tests
```

## Features

- **Batch Recipe Calculator** — add ingredients with weight, calories per 100g, and protein per 100g. Calculates total batch calories, protein, weight, and per-portion values. Save recipes to localStorage.
- **Cooked Rice Calculator** — computes cooked rice nutrition from dry measurements and final cooked weight.
- **Saved Meals** — view, load/ edit, duplicate, or delete saved recipes. Confirmation required before deleting.

## Rice Calculation Explained

Cooking rice adds water, increasing the total weight. The dry rice determines the total calories and protein in the batch — cooking only dilutes the concentration.

Given:
- `dryWeight` (g), `dryCals` (calories per 100g dry), `dryProt` (protein per 100g dry)
- `cookedWeight` (g) — the final weight after cooking
- `portions` — number of servings

Formulas:

```
totalCalories = dryWeight / 100 × dryCals
totalProtein  = dryWeight / 100 × dryProt

cookedCalsPer100g  = totalCalories / cookedWeight × 100
cookedProtPer100g  = totalProtein / cookedWeight × 100

gramsPerPortion    = cookedWeight / portions
calsPerPortion     = totalCalories / portions
protPerPortion     = totalProtein / portions
```

The key insight: total calories and protein come from the dry rice alone. The cooked weight only affects the per-100g concentration and per-portion weight.
