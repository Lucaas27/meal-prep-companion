# Meal Prep Companion

A polished, mobile-first progressive web app for planning, calculating, and managing meal prep recipes. Built with Vite, React 19, TypeScript, and shadcn/ui. Entirely local-first — all data lives in your browser.

## Setup

```bash
npm install
cp .env.example .env      # optional: configure Supabase
npm run dev                # start dev server
npm run build              # production build
npm test                   # run unit tests
```

### Supabase (optional)

The app works fully offline with localStorage. To enable remote persistence:

1. Create a project at [supabase.com](https://supabase.com)
2. Copy `.env.example` to `.env`
3. Fill in `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`

For local Supabase development:

```bash
npx supabase init
npx supabase start
```

### Edge Functions

**USDA Food Search** (`food-catalogue-search`):

1. Set the USDA API key as a Supabase secret:
   ```bash
   npx supabase secrets set USDA_API_KEY=your-usda-key
   ```

2. Deploy:
   ```bash
   npx supabase functions deploy food-catalogue-search
   ```

3. For local development:
   ```bash
   npx supabase functions serve food-catalogue-search
   ```

The function proxies USDA FoodData Central search through Supabase, requiring an authenticated user and returning provider-neutral search results.

**USDA Food Details** (`food-catalogue-details`):

1. Set the USDA API key as a Supabase secret:
   ```bash
   npx supabase secrets set USDA_API_KEY=your-usda-key
   ```

2. Deploy:
   ```bash
   npx supabase functions deploy food-catalogue-details
   ```

3. For local development:
   ```bash
   npx supabase functions serve food-catalogue-details
   ```

The details function also requires an authenticated user and returns provider-neutral food details for the import review flow.

### USDA Attribution

Imported food search and nutrition data comes from USDA FoodData Central.
Imported foods are saved as user-owned editable copies in this app and do not stay synchronised with USDA after import.

## Known Limitations

- Only USDA FoodData Central import is supported in v1.3.
- Imported foods are editable local copies, not live-linked records.
- Ingredient-specific units require a saved conversion before recipe and planner nutrition can be fully calculated.
- If a recipe references a missing conversion, nutrition is shown as incomplete instead of guessing a gram equivalent.

## Features

- **Recipe Library** — browse, search, sort, and filter your recipes. Grid or list view with pagination. Click a card to edit, star favourites, or duplicate.
- **Recipe Editor** — create and edit recipes in a slide-over Sheet. Searchable ingredient catalogue with ⌘K-style combobox, live nutrition totals, tags, notes, and Cmd/Ctrl+S to save. Unsaved changes prompt a confirmation dialog.
- **Dry-to-Cooked Calculator** — calculate nutritional values for any food that changes weight when cooked (rice, pasta, grains, etc.). Shows totals, per-100g, and per-portion breakdowns.
- **Ingredient Catalogue** — save frequently used ingredients with per-100g macros for quick reuse across recipes.
- **Dark mode** — default dark, toggle to light. Preference persisted.

## Architecture

```
src/
  app/           providers (TanStack Query, Theme, Tooltip) + layout
  features/
    recipes/     schemas, repository, hooks, utils, components, tests
    ingredients/ schemas, repository, hooks, components
    dry-to-cooked/ schemas, utils, components, tests
  shared/        lib (cn, ids, queryClient), constants, utils
```

**Data model:** Zod-validated schemas with backward-compatible defaults. Types inferred from schemas.

**State:** TanStack Query wraps localStorage repositories. Components never touch storage directly — repos are framework-agnostic.

**Styling:** Tailwind CSS + shadcn/ui. Dark/light via `next-themes`.

## Stack

React 19 · TypeScript 6 · Vite · TanStack Query · Zod · shadcn/ui · Tailwind CSS · next-themes · Supabase · Vitest
