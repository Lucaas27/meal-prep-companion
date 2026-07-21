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
