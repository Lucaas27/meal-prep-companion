# Barcode Scanning Design

## Goal

Add barcode scanning for ingredient import while reusing the existing external catalogue and ingredient import flow.

Scope for the future implementation:

1. User opens a barcode scanner from the Ingredient Catalogue.
2. Browser camera scans EAN/UPC barcodes.
3. Frontend sends the decoded barcode to a Supabase Edge Function.
4. Edge Function checks a local product cache first.
5. If not cached, it fetches the product from Open Food Facts.
6. Response is mapped into the existing external catalogue model.
7. User reviews and edits the product before adding it.
8. If missing or incomplete, user can fall back to manual entry.

This design keeps USDA for text search and uses Open Food Facts only for barcode lookup.

## Current Architecture Summary

### Ingredient domain

- `src/features/ingredients/schemas/ingredient.schema.ts`
  - Canonical ingredient model is `StoredIngredient`.
  - Provenance already exists through:
    - `source`
    - `externalSourceId`
    - `externalSourceName`
    - `importedAt`
  - `source` already allows `open-food-facts`.

### External catalogue

- `src/features/external-catalogue/types.ts`
  - Shared provider-neutral client types already exist:
    - `ExternalFoodSearchResult`
    - `ExternalFoodDetails`
    - `ProviderError`
- `src/features/external-catalogue/schemas.ts`
  - Provider-neutral Zod schemas already exist for search/details responses.
- `src/features/external-catalogue/client.ts`
  - Existing frontend client talks to Edge Functions via `supabase.functions.invoke(...)`.
  - Existing client-side cache is user-scoped and keyed by provider/query/details.
- `src/features/external-catalogue/components/ExternalFoodSearchDialog.tsx`
  - Existing review/edit/import UI already exists for USDA.
  - This is the strongest reuse point for barcode review.

### Import path

- `src/features/ingredients/services/import-external-ingredient.ts`
  - Existing import service already accepts provider-neutral import input.
  - It calls the DB RPC `import_external_ingredient_atomic`.
  - It already supports `provider: 'open-food-facts'` in input validation.
- `supabase/migrations/20260722153236_import_external_ingredient_atomic.sql`
  - Existing RPC validates imported ingredient data at the DB boundary.
  - Already supports `usda` and `open-food-facts`.

### Ingredient UI

- `src/features/ingredients/components/IngredientCatalogue.tsx`
  - Existing entry point for import actions.
  - Currently opens `ExternalFoodSearchDialog`.
- `src/features/ingredients/components/IngredientFormDialog.tsx`
  - Existing manual ingredient edit/create dialog.
  - Good fallback target if barcode lookup is incomplete.

### Persistence

- Local: `ingredientRepository`
- Remote: `supabaseIngredientRepository`
- Import logic is already centralized in the application service and RPC path.

### Database

- `supabase/migrations/20260721000006_ingredient_provenance.sql`
  - Ingredients already support provenance and duplicate prevention by provider + external source id.
- No local Open Food Facts cache table exists yet.

## Design Principles

- Reuse the external catalogue abstraction instead of creating a barcode-only ingredient system.
- Reuse the existing review/import UI patterns from USDA wherever possible.
- Keep Open Food Facts provider response mapping inside Edge Functions only.
- Keep the frontend on provider-neutral models.
- Keep imports going through the same atomic import service and DB RPC.
- Do not replace USDA text search. Barcode lookup is a second entry point.

## Proposed User Flow

### 1. Open scanner

- Add a new action in `IngredientCatalogue` next to the existing `Import` action.
- Label: `Scan Barcode`.
- Opens a scanner dialog/sheet.

### 2. Scan barcode

- Browser camera scans EAN-8, EAN-13, UPC-A, UPC-E.
- On a successful decode:
  - pause scanning
  - show the decoded code
  - resolve the product through a barcode lookup flow

### 3. Lookup product

- Frontend calls a new provider-neutral client function, for example:
  - `getFoodByBarcode(provider: 'open-food-facts', barcode: string)`
- That function invokes a new Edge Function.

### 4. Review and import

- Reuse the current review/edit pattern from `ExternalFoodSearchDialog`.
- User can:
  - edit name
  - edit category
  - edit nutrition per 100g
  - accept/reject any serving conversions inferred from the source
- Import uses the existing `useImportExternalIngredient` mutation.

### 5. Fallbacks

- If barcode not found:
  - show a clear not-found state
  - offer `Create manually`
- If barcode product exists but nutrition is too incomplete:
  - allow manual completion in the review step
  - or allow switching into manual ingredient creation prefilled from partial source data

## Proposed Files To Change

### Frontend

- `src/features/ingredients/components/IngredientCatalogue.tsx`
  - Add `Scan Barcode` action.
  - Open new barcode scanner dialog.
- `src/features/external-catalogue/client.ts`
  - Add barcode lookup client function.
  - Extend user-scoped cache keys for barcode detail lookups.
- `src/features/external-catalogue/hooks.ts`
  - Add React Query hook for barcode lookup.
- `src/features/external-catalogue/types.ts`
  - Add provider-neutral barcode lookup types if needed.
- `src/features/external-catalogue/schemas.ts`
  - Add Zod schemas for barcode lookup response if separate from search/details.
- `src/shared/constants/query-keys.ts`
  - Add centralized query keys for barcode lookup.
- `src/features/external-catalogue/components/ExternalFoodSearchDialog.tsx`
  - Extract or generalize the review form into a reusable component.
  - Keep one review/import path for USDA text results and barcode results.

### New frontend files

- `src/features/external-catalogue/components/BarcodeScannerDialog.tsx`
  - Camera UI and scan lifecycle.
- `src/features/external-catalogue/components/BarcodeLookupFlow.tsx`
  - Or merge into `BarcodeScannerDialog` if it stays small.
- `src/features/external-catalogue/barcode.ts`
  - Barcode normalization and supported-format helpers.

### Edge Functions

- `supabase/functions/food-catalogue-barcode/index.ts`
  - New authenticated barcode lookup function.
- optional shared helpers:
  - `supabase/functions/_shared/external-food.ts`
  - `supabase/functions/_shared/open-food-facts.ts`
  - only if reuse remains small and obvious

### Database / migrations

- New migration for local product cache table and indexes.
- Possibly update generated DB types after migration.

### Docs / tests

- Add tests under `src/features/external-catalogue/`
- Update README setup instructions for barcode scanning and Open Food Facts attribution if feature ships.

## Proposed Domain And API Contracts

### Frontend provider-neutral contract

Prefer reusing `ExternalFoodDetails` with minimal extension rather than adding a totally separate model.

Recommended addition:

```ts
type ExternalFoodProvider = 'usda' | 'open-food-facts';

interface ExternalFoodBarcodeLookupResult {
  provider: ExternalFoodProvider;
  externalId: string;
  barcode: string;
  name: string;
  description: string | null;
  brand: string | null;
  dataType: string | null;
  caloriesPer100g: number | null;
  proteinPer100g: number | null;
  carbohydratesPer100g: number | null;
  fatPer100g: number | null;
  category: string | null;
  servingOptions: ExternalServingOption[];
  sourceUrl: string | null;
  retrievedAt: string;
}
```

This could also just be folded into `ExternalFoodDetails` by treating barcode lookup as another details source.

### Edge Function request

```json
{
  "barcode": "5010029201104"
}
```

### Edge Function success response

```json
{
  "provider": "open-food-facts",
  "externalId": "5010029201104",
  "barcode": "5010029201104",
  "name": "Example Product",
  "description": null,
  "brand": "Example Brand",
  "dataType": "packaged-food",
  "caloriesPer100g": 250,
  "proteinPer100g": 6,
  "carbohydratesPer100g": 30,
  "fatPer100g": 10,
  "category": "Snack",
  "servingOptions": [],
  "sourceUrl": "https://world.openfoodfacts.org/product/5010029201104",
  "retrievedAt": "2026-07-22T00:00:00.000Z"
}
```

### Edge Function error response

Reuse the existing provider-error style:

```json
{ "error": "not_found", "message": "Barcode not found" }
{ "error": "invalid_query", "message": "Barcode must be EAN or UPC" }
{ "error": "rate_limited", "message": "Open Food Facts rate limit exceeded" }
{ "error": "unavailable", "message": "Open Food Facts unavailable" }
{ "error": "invalid_response", "message": "Unexpected Open Food Facts response format" }
```

### Import contract

Reuse `ImportExternalIngredientInput`.

For Open Food Facts imports:

- `provider = 'open-food-facts'`
- `externalId = barcode`
- `externalSourceName = source product name`

## Proposed Database Changes

### New cache table

Add a private cache table in `public` only if you need client access via RPC/Edge Function reads; otherwise prefer a non-exposed schema like `private`.

Recommended schema: `private.open_food_facts_products`

Columns:

- `barcode text primary key`
- `source_payload jsonb not null`
- `mapped_payload jsonb not null`
- `product_name text`
- `brand text`
- `last_fetched_at timestamptz not null default now()`
- `expires_at timestamptz not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Why both payloads:

- `source_payload` preserves the raw OFF response for debugging/remapping.
- `mapped_payload` stores the already-normalized app contract the Edge Function can return cheaply.

### Access model

- Do not expose this table directly to frontend clients.
- Access it only from the Edge Function, preferably via direct DB query or RPC.
- No user-specific ownership needed if the cache is shared product metadata.

### Ingredient provenance

No new ingredient provenance columns required.

Use the existing columns:

- `source = 'open-food-facts'`
- `external_source_id = barcode`
- `external_source_name = product name`

### Duplicate handling

Current unique index already prevents duplicate imports per user for `open-food-facts`.

Documented behavior:

- same user + same barcode: return structured duplicate result
- different users + same barcode: allowed, independent local copies

## Cache Strategy

### Server-side cache

Primary cache should be in Supabase/Postgres, not localStorage.

Read order:

1. Edge Function validates barcode.
2. Edge Function checks `private.open_food_facts_products`.
3. If hit and not expired, return cached mapped payload.
4. If miss/expired, call Open Food Facts.
5. Validate and map response.
6. Upsert cache row.
7. Return mapped payload.

TTL recommendation:

- 7 days default
- keep stale data if OFF is temporarily unavailable and cached data exists, but mark the response as cached/stale only if the UI needs to know

### Client-side cache

Keep the existing user-scoped localStorage cache pattern in `external-catalogue/client.ts`.

Add barcode-specific key shapes, for example:

- `external-food-cache:v1:<userId>:barcode:<barcode>`

This is still useful for:

- re-opening recent scans
- avoiding repeated edge-function calls during review
- preserving per-user cache isolation after sign-out

## Scanner Component Boundaries

### `BarcodeScannerDialog`

Responsibilities:

- request camera permission
- start/stop camera stream
- decode EAN/UPC values
- debounce duplicate scans
- hand off decoded code to lookup flow

Non-responsibilities:

- Open Food Facts mapping
- import logic
- ingredient persistence

### `BarcodeLookupFlow`

Responsibilities:

- fetch barcode details via React Query
- render loading/not found/error states
- route successful lookup into shared review form
- offer manual fallback

### Shared review form

Prefer extracting the review form from `ExternalFoodSearchDialog` into something like:

- `ExternalIngredientReviewForm`

Inputs:

- provider-neutral food details
- duplicate lookup result
- import mutation callback
- open-existing callback
- manual fallback callback

That lets USDA and barcode import share:

- nutrition editing
- category selection
- conversion approval
- duplicate handling
- import failure preservation

## Error States

### Camera / scanner

- camera permission denied
- no camera available
- scanner library init failure
- unsupported browser
- barcode detected but unsupported format
- multiple rapid scans of same code

### Lookup

- unauthenticated
- invalid barcode
- not found
- provider unavailable
- provider rate limited
- invalid provider response
- local cache read/write failure

### Review / import

- duplicate existing import
- incomplete nutrition
- missing product name
- import validation failure
- import storage failure

### UX handling

- keep scanned code visible on failure
- preserve edited review form values on failed import
- allow retry without reopening camera
- allow switch to manual creation with prefilled name/brand if available

## Open Food Facts Mapping Notes

Map OFF data into the app’s existing normalized model.

Likely raw fields:

- barcode: `code`
- name: `product_name`
- brand: `brands`
- categories: `categories_tags` or `categories`
- nutriments per 100g:
  - `energy-kcal_100g`
  - `proteins_100g`
  - `carbohydrates_100g`
  - `fat_100g`

Normalization rules:

- prefer explicit per-100g nutriments only
- do not derive per-100g from serving if missing unless explicitly chosen later
- if OFF only has serving data, return partial values as `null` and require user review
- keep `description` optional/null
- packaged products likely produce no serving conversions initially unless OFF has trustworthy serving-unit metadata

## Testing Strategy

### Unit tests

Frontend:

- barcode normalization helper
- scanner duplicate-scan debounce logic
- barcode React Query hook
- shared review form behavior for barcode results
- duplicate handling path
- manual fallback trigger

Edge Function:

- barcode validation
- cache hit path
- cache miss path
- OFF mapping
- not found
- invalid OFF response
- provider unavailable / rate limit

### Integration tests

- scan -> lookup -> review -> import happy path
- duplicate import recovery path
- partial product -> manual edit -> import
- user-scoped cache cleared on sign-out
- user A and user B can import same OFF barcode independently

### Database tests

- cache table migration applies cleanly
- cache upsert semantics
- duplicate provenance uniqueness still works for `open-food-facts`

### Manual QA

- camera permission flow on desktop/mobile
- scan in dim light and with focus lag
- product not found flow
- incomplete product flow
- mobile dialog layout and controls

## Deployment Steps

1. Add migration for local OFF product cache table.
2. Regenerate `database.types.ts` if the project keeps generated DB types committed.
3. Implement new Edge Function:
   - `food-catalogue-barcode`
4. Add local function TS support if needed.
5. Deploy the Edge Function with JWT verification enabled.
6. Update frontend client/hooks/query keys.
7. Add scanner UI behind the Ingredient Catalogue entry point.
8. Run:
   - unit tests
   - integration tests
   - typecheck
   - lint
   - production build
9. Verify local Supabase reset and local function invocation.
10. Update README with:
   - Open Food Facts attribution
   - camera permission note
   - known limitations

## Recommended Implementation Order

1. Edge Function and DB cache
2. Frontend barcode client + hooks
3. Shared review form extraction
4. Scanner dialog UI
5. Import/copy/manual fallback UX
6. Tests and docs

## Open Questions

- Which scanner library should be used: native `BarcodeDetector` first with fallback, or a single cross-browser library from the start?
- Should OFF cached products be globally shared across all users or user-scoped? Current recommendation: globally shared metadata cache, user-scoped import records.
- Should partial OFF products allow import with `null` nutrition values, or require user completion before import? Current recommendation: require user review and allow `0`/edited values only through explicit user action.

## Recommendation

Implement barcode scanning as a new entry point into the existing external catalogue/import pipeline.

Do not build a second ingredient ingestion system.

The core reuse points should be:

- `ExternalFoodDetails`-style provider-neutral contracts
- existing import review UX
- existing `useImportExternalIngredient` mutation
- existing `import_external_ingredient_atomic` RPC
- existing ingredient provenance fields and duplicate rules
