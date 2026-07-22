import { describe, expect, it, vi } from 'vitest';
import {
  buildOpenFoodFactsUrl,
  mapOpenFoodFactsProduct,
  resolveBarcodeProduct,
  type BarcodeCacheRow,
} from './shared';

const sampleFetchedAt = new Date('2026-07-22T00:00:00.000Z');

function makeCacheRow(overrides: Partial<BarcodeCacheRow> = {}): BarcodeCacheRow {
  return {
    id: 'cache-1',
    normalized_barcode: '0036000291452',
    provider: 'open_food_facts',
    provider_product_id: '0036000291452',
    product_name: 'Example Product',
    brand: 'Example Brand',
    image_url: 'https://example.com/image.jpg',
    package_quantity_text: '500 g',
    serving_size_text: '30 g',
    serving_quantity_grams: 30,
    calories_per_100g: 250,
    protein_per_100g: 6,
    carbohydrates_per_100g: 30,
    fat_per_100g: 10,
    fibre_per_100g: 3,
    salt_per_100g: 0.4,
    sodium_per_100g: null,
    raw_provider_response: {},
    completeness_status: 'complete',
    fetched_at: sampleFetchedAt.toISOString(),
    expires_at: new Date(sampleFetchedAt.getTime() + 60_000).toISOString(),
    created_at: sampleFetchedAt.toISOString(),
    updated_at: sampleFetchedAt.toISOString(),
    ...overrides,
  };
}

describe('buildOpenFoodFactsUrl', () => {
  it('requests only the fields used by the app', () => {
    const url = buildOpenFoodFactsUrl('0036000291452');
    expect(url).toContain('/product/0036000291452.json');
    expect(url).toContain('product_name');
    expect(url).toContain('serving_quantity');
    expect(url).toContain('nutriments');
  });
});

describe('mapOpenFoodFactsProduct', () => {
  it('maps a valid product into the internal barcode model', () => {
    const mapped = mapOpenFoodFactsProduct({
      code: '0036000291452',
      product: {
        product_name: 'Example Product',
        brands: 'Example Brand',
        image_url: 'https://example.com/image.jpg',
        quantity: '500 g',
        serving_size: '30 g',
        serving_quantity: 30,
        categories: 'Snacks, Chocolate',
        nutriments: {
          'energy-kcal_100g': 250,
          proteins_100g: 6,
          carbohydrates_100g: 30,
          fat_100g: 10,
          fiber_100g: 3,
          salt_100g: 0.4,
        },
      },
      result: { id: 'product_found' },
    }, '0036000291452', sampleFetchedAt);

    expect(mapped).toMatchObject({
      provider: 'open-food-facts',
      barcode: '0036000291452',
      name: 'Example Product',
      brand: 'Example Brand',
      imageUrl: 'https://example.com/image.jpg',
      caloriesPer100g: 250,
      proteinPer100g: 6,
      carbohydratesPer100g: 30,
      fatPer100g: 10,
      fibrePer100g: 3,
      saltPer100g: 0.4,
      completenessStatus: 'complete',
    });
  });

  it('keeps missing nutrient fields as null', () => {
    const mapped = mapOpenFoodFactsProduct({
      code: '0036000291452',
      product: {
        product_name: 'Sparse Product',
        nutriments: {},
      },
      result: { id: 'product_found' },
    }, '0036000291452', sampleFetchedAt);

    expect(mapped).toMatchObject({
      caloriesPer100g: null,
      proteinPer100g: null,
      carbohydratesPer100g: null,
      fatPer100g: null,
      fibrePer100g: null,
      completenessStatus: 'missing_nutrition',
    });
  });

  it('returns null for malformed provider payloads', () => {
    expect(mapOpenFoodFactsProduct({ status: 'success', product: 'broken' }, '0036000291452', sampleFetchedAt)).toBeNull();
  });
});

describe('resolveBarcodeProduct', () => {
  it('returns invalid barcode errors before any IO', async () => {
    const readCache = vi.fn();
    const result = await resolveBarcodeProduct('bad-barcode', {
      readCache,
      fetchProvider: vi.fn(),
      writeCache: vi.fn(),
    });

    expect(result).toEqual({ status: 400, error: 'invalid_query', message: 'Barcode must be a valid EAN or UPC.' });
    expect(readCache).not.toHaveBeenCalled();
  });

  it('returns a fresh cache hit without provider fetch', async () => {
    const fetchProvider = vi.fn();
    const result = await resolveBarcodeProduct('036000291452', {
      now: () => sampleFetchedAt,
      readCache: vi.fn().mockResolvedValue(makeCacheRow()),
      fetchProvider,
      writeCache: vi.fn(),
    });

    expect(result.status).toBe(200);
    if ('error' in result) throw new Error('expected success');
    expect(result.cacheOutcome).toBe('hit');
    expect(result.providerStatus).toBe('cached');
    expect(fetchProvider).not.toHaveBeenCalled();
  });

  it('fetches and recaches expired cache entries', async () => {
    const writeCache = vi.fn();
    const result = await resolveBarcodeProduct('036000291452', {
      now: () => sampleFetchedAt,
      readCache: vi.fn().mockResolvedValue(makeCacheRow({ expires_at: new Date(sampleFetchedAt.getTime() - 1).toISOString() })),
      fetchProvider: vi.fn().mockResolvedValue({
        status: 200,
        body: {
          code: '0036000291452',
          product: {
            product_name: 'Fetched Product',
            nutriments: {
              'energy-kcal_100g': 250,
              proteins_100g: 6,
              carbohydrates_100g: 30,
              fat_100g: 10,
            },
          },
          result: { id: 'product_found' },
        },
      }),
      writeCache,
    });

    expect(result.status).toBe(200);
    if ('error' in result) throw new Error('expected success');
    expect(result.cacheOutcome).toBe('expired');
    expect(result.providerStatus).toBe('fetched');
    expect(writeCache).toHaveBeenCalledTimes(1);
  });

  it('returns not found when the provider has no product for the barcode', async () => {
    const result = await resolveBarcodeProduct('036000291452', {
      readCache: vi.fn().mockResolvedValue(null),
      fetchProvider: vi.fn().mockResolvedValue({ status: 404, body: {} }),
      writeCache: vi.fn(),
    });

    expect(result).toEqual({ status: 404, error: 'not_found', message: 'Barcode product not found.' });
  });

  it('returns provider 429 as a structured rate limit error', async () => {
    const result = await resolveBarcodeProduct('036000291452', {
      readCache: vi.fn().mockResolvedValue(null),
      fetchProvider: vi.fn().mockResolvedValue({ status: 429, body: {} }),
      writeCache: vi.fn(),
    });

    expect(result).toEqual({ status: 429, error: 'rate_limited', message: 'Open Food Facts rate limit exceeded.' });
  });

  it('returns provider 500 as unavailable', async () => {
    const result = await resolveBarcodeProduct('036000291452', {
      readCache: vi.fn().mockResolvedValue(null),
      fetchProvider: vi.fn().mockResolvedValue({ status: 500, body: {} }),
      writeCache: vi.fn(),
    });

    expect(result).toEqual({ status: 502, error: 'unavailable', message: 'Open Food Facts is unavailable.' });
  });

  it('returns invalid_response for malformed provider payloads', async () => {
    const result = await resolveBarcodeProduct('036000291452', {
      readCache: vi.fn().mockResolvedValue(null),
      fetchProvider: vi.fn().mockResolvedValue({ status: 200, body: { product: 'broken' } }),
      writeCache: vi.fn(),
    });

    expect(result).toEqual({ status: 502, error: 'invalid_response', message: 'Unexpected Open Food Facts response format.' });
  });
});
