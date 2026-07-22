import { normalizeBarcode } from '../../../src/features/external-catalogue/barcode';
import type { ExternalBarcodeFoodDetails } from '../../../src/features/external-catalogue/types';

export const OPEN_FOOD_FACTS_BASE = 'https://world.openfoodfacts.org/api/v3';
export const BARCODE_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export type BarcodeLookupErrorCode =
  | 'invalid_query'
  | 'unauthenticated'
  | 'not_found'
  | 'rate_limited'
  | 'unavailable'
  | 'invalid_response';

export interface BarcodeLookupError {
  status: number;
  error: BarcodeLookupErrorCode;
  message: string;
}

export interface BarcodeLookupSuccess {
  status: 200;
  data: ExternalBarcodeFoodDetails;
  cacheOutcome: 'hit' | 'miss' | 'expired';
  providerStatus: 'cached' | 'fetched';
  rawProviderResponse?: unknown;
}

export type BarcodeLookupResult = BarcodeLookupSuccess | BarcodeLookupError;

export interface BarcodeCacheRow {
  id: string;
  normalized_barcode: string;
  provider: 'open_food_facts';
  provider_product_id: string;
  product_name: string | null;
  brand: string | null;
  image_url: string | null;
  package_quantity_text: string | null;
  serving_size_text: string | null;
  serving_quantity_grams: number | null;
  calories_per_100g: number | null;
  protein_per_100g: number | null;
  carbohydrates_per_100g: number | null;
  fat_per_100g: number | null;
  fibre_per_100g: number | null;
  salt_per_100g: number | null;
  sodium_per_100g: number | null;
  raw_provider_response: unknown;
  completeness_status: ExternalBarcodeFoodDetails['completenessStatus'];
  fetched_at: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

interface OpenFoodFactsResponse {
  code?: string;
  status?: string;
  product?: Record<string, unknown> | null;
  result?: { id?: string } | null;
}

function asNullableString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function asNullableNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function pickCategory(product: Record<string, unknown>) {
  if (typeof product.categories === 'string' && product.categories.trim()) {
    const [first] = product.categories.split(',');
    return first?.trim() || null;
  }

  const tags = product.categories_tags;
  if (Array.isArray(tags)) {
    const first = tags.find((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0);
    return first ? first.replace(/^en:/, '').replace(/-/g, ' ') : null;
  }

  return null;
}

function getCompletenessStatus(mapped: Omit<ExternalBarcodeFoodDetails, 'completenessStatus'>): ExternalBarcodeFoodDetails['completenessStatus'] {
  if (!mapped.name.trim()) return 'missing_name';

  const keyNutrients = [
    mapped.caloriesPer100g,
    mapped.proteinPer100g,
    mapped.carbohydratesPer100g,
    mapped.fatPer100g,
  ];

  if (keyNutrients.every((value) => value == null)) return 'missing_nutrition';
  if (keyNutrients.some((value) => value == null)) return 'partial';
  return 'complete';
}

export function mapCacheRowToBarcodeDetails(row: BarcodeCacheRow): ExternalBarcodeFoodDetails {
  const rawProduct = row.raw_provider_response && typeof row.raw_provider_response === 'object'
    ? (row.raw_provider_response as { product?: Record<string, unknown> }).product
    : undefined;

  return {
    provider: 'open-food-facts',
    externalId: row.provider_product_id,
    barcode: row.normalized_barcode,
    name: row.product_name ?? '',
    description: null,
    brand: row.brand,
    dataType: 'packaged-food',
    caloriesPer100g: row.calories_per_100g,
    proteinPer100g: row.protein_per_100g,
    carbohydratesPer100g: row.carbohydrates_per_100g,
    fatPer100g: row.fat_per_100g,
    fibrePer100g: row.fibre_per_100g,
    saltPer100g: row.salt_per_100g,
    sodiumPer100g: row.sodium_per_100g,
    category: rawProduct ? pickCategory(rawProduct) : null,
    servingOptions: [],
    sourceUrl: `https://world.openfoodfacts.org/product/${row.provider_product_id}`,
    retrievedAt: row.fetched_at,
    imageUrl: row.image_url,
    packageQuantityText: row.package_quantity_text,
    servingSizeText: row.serving_size_text,
    servingQuantityGrams: row.serving_quantity_grams,
    completenessStatus: row.completeness_status,
  };
}

export function mapOpenFoodFactsProduct(raw: unknown, normalizedBarcode: string, fetchedAt = new Date()): ExternalBarcodeFoodDetails | null {
  if (!raw || typeof raw !== 'object') return null;

  const response = raw as OpenFoodFactsResponse;
  const product = response.product;
  if (!product || typeof product !== 'object') return null;

  const nutriments = (product.nutriments && typeof product.nutriments === 'object') ? product.nutriments as Record<string, unknown> : {};
  const servingQuantity = asNullableNumber(product.serving_quantity);

  const mappedBase = {
    provider: 'open-food-facts' as const,
    externalId: asNullableString(response.code) ?? normalizedBarcode,
    barcode: normalizedBarcode,
    name: asNullableString(product.product_name) ?? '',
    description: null,
    brand: asNullableString(product.brands),
    dataType: 'packaged-food',
    caloriesPer100g: asNullableNumber(nutriments['energy-kcal_100g']),
    proteinPer100g: asNullableNumber(nutriments.proteins_100g),
    carbohydratesPer100g: asNullableNumber(nutriments.carbohydrates_100g),
    fatPer100g: asNullableNumber(nutriments.fat_100g),
    fibrePer100g: asNullableNumber(nutriments.fiber_100g ?? nutriments.fibre_100g),
    saltPer100g: asNullableNumber(nutriments.salt_100g),
    sodiumPer100g: asNullableNumber(nutriments.sodium_100g),
    category: pickCategory(product),
    servingOptions: [],
    sourceUrl: `https://world.openfoodfacts.org/product/${asNullableString(response.code) ?? normalizedBarcode}`,
    retrievedAt: fetchedAt.toISOString(),
    imageUrl: asNullableString(product.image_url),
    packageQuantityText: asNullableString(product.quantity),
    servingSizeText: asNullableString(product.serving_size),
    servingQuantityGrams: servingQuantity,
  };

  return {
    ...mappedBase,
    completenessStatus: getCompletenessStatus(mappedBase),
  };
}

export function buildOpenFoodFactsUrl(normalizedBarcode: string) {
  const fields = [
    'code',
    'product_name',
    'brands',
    'image_url',
    'quantity',
    'serving_size',
    'serving_quantity',
    'categories',
    'categories_tags',
    'nutriments',
  ].join(',');

  return `${OPEN_FOOD_FACTS_BASE}/product/${normalizedBarcode}.json?fields=${encodeURIComponent(fields)}`;
}

export function toCachePayload(details: ExternalBarcodeFoodDetails, rawProviderResponse: unknown, fetchedAt = new Date()) {
  return {
    normalized_barcode: details.barcode,
    provider: 'open_food_facts',
    provider_product_id: details.externalId,
    product_name: details.name,
    brand: details.brand,
    image_url: details.imageUrl,
    package_quantity_text: details.packageQuantityText,
    serving_size_text: details.servingSizeText,
    serving_quantity_grams: details.servingQuantityGrams,
    calories_per_100g: details.caloriesPer100g,
    protein_per_100g: details.proteinPer100g,
    carbohydrates_per_100g: details.carbohydratesPer100g,
    fat_per_100g: details.fatPer100g,
    fibre_per_100g: details.fibrePer100g,
    salt_per_100g: details.saltPer100g,
    sodium_per_100g: details.sodiumPer100g,
    raw_provider_response: rawProviderResponse,
    completeness_status: details.completenessStatus,
    fetched_at: fetchedAt.toISOString(),
    expires_at: new Date(fetchedAt.getTime() + BARCODE_CACHE_TTL_MS).toISOString(),
  };
}

export async function resolveBarcodeProduct(
  barcode: string,
  deps: {
    now?: () => Date;
    readCache: (normalizedBarcode: string) => Promise<BarcodeCacheRow | null>;
    fetchProvider: (normalizedBarcode: string) => Promise<{ status: number; body: unknown }>;
    writeCache: (payload: ReturnType<typeof toCachePayload>) => Promise<void>;
  },
): Promise<BarcodeLookupResult> {
  const normalized = normalizeBarcode(barcode);
  if (!normalized) {
    return { status: 400, error: 'invalid_query', message: 'Barcode must be a valid EAN or UPC.' };
  }

  const now = deps.now?.() ?? new Date();
  const cached = await deps.readCache(normalized);
  if (cached) {
    if (new Date(cached.expires_at).getTime() > now.getTime()) {
      return {
        status: 200,
        data: mapCacheRowToBarcodeDetails(cached),
        cacheOutcome: 'hit',
        providerStatus: 'cached',
      };
    }
  }

  const provider = await deps.fetchProvider(normalized);

  if (provider.status === 404) {
    return { status: 404, error: 'not_found', message: 'Barcode product not found.' };
  }

  if (provider.status === 429) {
    return { status: 429, error: 'rate_limited', message: 'Open Food Facts rate limit exceeded.' };
  }

  if (provider.status < 200 || provider.status >= 300) {
    return { status: 502, error: 'unavailable', message: 'Open Food Facts is unavailable.' };
  }

  const mapped = mapOpenFoodFactsProduct(provider.body, normalized, now);
  if (!mapped) {
    return { status: 502, error: 'invalid_response', message: 'Unexpected Open Food Facts response format.' };
  }

  await deps.writeCache(toCachePayload(mapped, provider.body, now));

  return {
    status: 200,
    data: mapped,
    cacheOutcome: cached ? 'expired' : 'miss',
    providerStatus: 'fetched',
    rawProviderResponse: provider.body,
  };
}
