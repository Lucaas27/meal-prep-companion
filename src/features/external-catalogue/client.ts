import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { safeParseJson } from '@/shared/lib/storage';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { barcodeLookupRequestSchema, externalBarcodeFoodDetailsSchema, externalFoodSearchPageSchema, externalFoodDetailsSchema } from './schemas';
import { ProviderError } from './types';
import { normalizeBarcode } from './barcode';
import type { ExternalBarcodeFoodDetails, ExternalBarcodeLookupRequest, ExternalFoodSearchPage, ExternalFoodDetails } from './types';

const CACHE_TTL_MS = 3 * 24 * 60 * 60 * 1000;
const CACHE_PREFIX = 'external-food-cache:v1';

type CacheEntry<T> = {
  expiresAt: number;
  data: T;
};

function readCache<T>(key: string, parse: (value: unknown) => T | null): T | null {
  if (typeof localStorage === 'undefined') return null;

  const entry = safeParseJson<CacheEntry<unknown> | null>(localStorage.getItem(key), null);
  if (!entry || typeof entry !== 'object' || typeof entry.expiresAt !== 'number') return null;

  if (entry.expiresAt <= Date.now()) {
    localStorage.removeItem(key);
    return null;
  }

  const parsed = parse(entry.data);
  if (parsed) return parsed;

  localStorage.removeItem(key);
  return null;
}

function writeCache<T>(key: string, data: T) {
  if (typeof localStorage === 'undefined') return;

  try {
    // browser-local cache is enough here; add shared/server cache only if cross-device reuse matters.
    localStorage.setItem(key, JSON.stringify({ expiresAt: Date.now() + CACHE_TTL_MS, data }));
  } catch {
    // Ignore storage failures and fall back to the network path.
  }
}

function parseSearchPage(value: unknown): ExternalFoodSearchPage | null {
  const parsed = externalFoodSearchPageSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function parseFoodDetails(value: unknown): ExternalFoodDetails | null {
  const parsed = externalFoodDetailsSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function parseBarcodeFoodDetails(value: unknown): ExternalBarcodeFoodDetails | null {
  const parsed = externalBarcodeFoodDetailsSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

async function getCacheScope() {
  const supabase = getSupabaseClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? 'anonymous';
}

function makeCacheKey(scope: string, kind: 'search' | 'details' | 'barcode', ...parts: string[]) {
  return `${CACHE_PREFIX}:${scope}:${kind}:${parts.join(':')}`;
}

async function mapFunctionError(error: unknown, provider: string) {
  if (error instanceof FunctionsHttpError && error.context instanceof Response) {
    const payload = await error.context.clone().json().catch(() => null) as { error?: string; message?: string } | null;
    const code = payload?.error;
    const message = payload?.message || error.message;

    if (code === 'invalid_query') throw new ProviderError('invalid_query', message, provider, error);
    if (code === 'unauthenticated') throw new ProviderError('unauthenticated', message, provider, error);
    if (code === 'not_found') throw new ProviderError('not_found', message, provider, error);
    if (code === 'rate_limited') throw new ProviderError('rate_limited', message, provider, error);
    if (code === 'invalid_response') throw new ProviderError('invalid_response', message, provider, error);
  }

  throw new ProviderError('unavailable', error instanceof Error ? error.message : 'Lookup failed', provider, error);
}

export function clearExternalFoodCache() {
  if (typeof localStorage === 'undefined') return;

  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  for (const key of keysToRemove) {
    localStorage.removeItem(key);
  }
}

export async function searchFoods(query: string, page = 1, pageSize = 20): Promise<ExternalFoodSearchPage> {
  const cacheKey = makeCacheKey(await getCacheScope(), 'search', query, String(page), String(pageSize));
  const cached = readCache(cacheKey, parseSearchPage);
  if (cached) return cached;

  const supabase = getSupabaseClient();

  const { data, error } = await supabase.functions.invoke('food-catalogue-search', {
    body: { query, page, pageSize },
  });

  if (error) {
    if (error.message?.includes('rate_limited')) throw new ProviderError('rate_limited', error.message, 'usda');
    if (error.message?.includes('unauthenticated')) throw new ProviderError('unauthenticated', error.message, 'usda');
    throw new ProviderError('unavailable', error.message || 'Search failed', 'usda');
  }

  const parsed = externalFoodSearchPageSchema.safeParse(data);
  if (!parsed.success) {
    throw new ProviderError('invalid_response', 'Invalid search response from provider', 'usda', parsed.error);
  }

  writeCache(cacheKey, parsed.data);
  return parsed.data;
}

export async function getFoodDetails(provider: string, externalId: string): Promise<ExternalFoodDetails> {
  const cacheKey = makeCacheKey(await getCacheScope(), 'details', provider, externalId);
  const cached = readCache(cacheKey, parseFoodDetails);
  if (cached) return cached;

  const supabase = getSupabaseClient();

  const { data, error } = await supabase.functions.invoke('food-catalogue-details', {
    body: { provider, externalId },
  });

  if (error) {
    if (error.message?.includes('not_found')) throw new ProviderError('not_found', `Food ${externalId} not found`, provider);
    if (error.message?.includes('rate_limited')) throw new ProviderError('rate_limited', error.message, provider);
    throw new ProviderError('unavailable', error.message || 'Details fetch failed', provider);
  }

  const parsed = externalFoodDetailsSchema.safeParse(data);
  if (!parsed.success) {
    throw new ProviderError('invalid_response', 'Invalid details response from provider', provider, parsed.error);
  }

  writeCache(cacheKey, parsed.data);
  return parsed.data;
}

export async function getFoodByBarcode(request: ExternalBarcodeLookupRequest): Promise<ExternalBarcodeFoodDetails> {
  const parsedRequest = barcodeLookupRequestSchema.safeParse(request);
  if (!parsedRequest.success) {
    throw new ProviderError('invalid_query', parsedRequest.error.issues[0]?.message || 'Invalid barcode request', 'open-food-facts', parsedRequest.error);
  }

  const normalizedBarcode = normalizeBarcode(parsedRequest.data.barcode);
  if (!normalizedBarcode) {
    throw new ProviderError('invalid_query', 'Barcode must be a valid EAN or UPC.', 'open-food-facts');
  }

  const cacheKey = makeCacheKey(await getCacheScope(), 'barcode', normalizedBarcode);
  const cached = readCache(cacheKey, parseBarcodeFoodDetails);
  if (cached) return cached;

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.functions.invoke('food-catalogue-barcode', {
    body: { barcode: normalizedBarcode },
  });

  if (error) {
    await mapFunctionError(error, 'open-food-facts');
  }

  const parsed = externalBarcodeFoodDetailsSchema.safeParse(data);
  if (!parsed.success) {
    throw new ProviderError('invalid_response', 'Invalid barcode response from provider', 'open-food-facts', parsed.error);
  }

  writeCache(cacheKey, parsed.data);
  return parsed.data;
}
