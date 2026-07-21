import { getSupabaseClient } from '@/infrastructure/supabase/client';
import { externalFoodSearchPageSchema, externalFoodDetailsSchema } from './schemas';
import { ProviderError } from './types';
import type { ExternalFoodSearchPage, ExternalFoodDetails } from './types';

export async function searchFoods(query: string, page = 1, pageSize = 20): Promise<ExternalFoodSearchPage> {
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

  return parsed.data;
}

export async function getFoodDetails(provider: string, externalId: string): Promise<ExternalFoodDetails> {
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

  return parsed.data;
}
