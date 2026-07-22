import { z } from 'npm:zod';
import {
  buildOpenFoodFactsUrl,
  resolveBarcodeProduct,
  type BarcodeCacheRow,
} from './shared.ts';

const requestSchema = z.object({
  barcode: z.string().trim().min(1).max(64),
});

const cacheRowSchema = z.object({
  id: z.string(),
  normalized_barcode: z.string(),
  provider: z.literal('open_food_facts'),
  provider_product_id: z.string(),
  product_name: z.string().nullable(),
  brand: z.string().nullable(),
  image_url: z.string().nullable(),
  package_quantity_text: z.string().nullable(),
  serving_size_text: z.string().nullable(),
  serving_quantity_grams: z.number().nullable(),
  calories_per_100g: z.number().nullable(),
  protein_per_100g: z.number().nullable(),
  carbohydrates_per_100g: z.number().nullable(),
  fat_per_100g: z.number().nullable(),
  fibre_per_100g: z.number().nullable(),
  salt_per_100g: z.number().nullable(),
  sodium_per_100g: z.number().nullable(),
  raw_provider_response: z.unknown(),
  completeness_status: z.enum(['complete', 'partial', 'missing_name', 'missing_nutrition']),
  fetched_at: z.string(),
  expires_at: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function makeRpcHeaders(serviceRoleKey: string) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
  };
}

async function getAuthenticatedUser(req: Request) {
  const authorization = req.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return null;

  const supabaseUrl = getRequiredEnv('SUPABASE_URL');
  const anonKey = getRequiredEnv('SUPABASE_ANON_KEY');
  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: authorization,
    },
  });

  if (!response.ok) return null;
  const data = await response.json();
  return typeof data?.id === 'string' ? { id: data.id } : null;
}

async function readCache(normalizedBarcode: string): Promise<BarcodeCacheRow | null> {
  const supabaseUrl = getRequiredEnv('SUPABASE_URL');
  const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_barcode_product_cache`, {
    method: 'POST',
    headers: makeRpcHeaders(serviceRoleKey),
    body: JSON.stringify({ p_normalized_barcode: normalizedBarcode }),
  });

  if (!response.ok) {
    throw new Error(`Cache read failed with status ${response.status}`);
  }

  const body = await response.json();
  if (!body) return null;

  const parsed = cacheRowSchema.safeParse(body);
  return parsed.success ? parsed.data : null;
}

async function writeCache(payload: Record<string, unknown>) {
  const supabaseUrl = getRequiredEnv('SUPABASE_URL');
  const serviceRoleKey = getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY');

  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/upsert_barcode_product_cache`, {
    method: 'POST',
    headers: makeRpcHeaders(serviceRoleKey),
    body: JSON.stringify({ p_payload: payload }),
  });

  if (!response.ok) {
    throw new Error(`Cache write failed with status ${response.status}`);
  }
}

async function fetchProvider(normalizedBarcode: string) {
  const userAgent = getRequiredEnv('OPEN_FOOD_FACTS_USER_AGENT');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(buildOpenFoodFactsUrl(normalizedBarcode), {
      headers: {
        'User-Agent': userAgent,
      },
      signal: controller.signal,
    });

    const body = await response.json().catch(() => null);

    if (response.ok && body && typeof body === 'object') {
      const resultId = typeof (body as { result?: { id?: unknown } }).result?.id === 'string'
        ? (body as { result: { id: string } }).result.id
        : null;
      if (resultId === 'product_not_found') {
        return { status: 404, body };
      }
    }

    return { status: response.status, body };
  } finally {
    clearTimeout(timeout);
  }
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req: Request) => {
  const startedAt = Date.now();
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const user = await getAuthenticatedUser(req);
    if (!user) {
      return jsonResponse({ error: 'unauthenticated', message: 'Authentication required.' }, 401);
    }

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonResponse({ error: 'invalid_query', message: parsed.error.issues[0]?.message || 'Invalid request' }, 400);
    }

    const result = await resolveBarcodeProduct(parsed.data.barcode, {
      readCache,
      fetchProvider,
      writeCache,
    });

    if ('error' in result) {
      console.info('barcode_lookup', {
        barcode: parsed.data.barcode,
        cacheOutcome: 'none',
        providerStatus: result.error,
        resultStatus: result.error,
        durationMs: Date.now() - startedAt,
      });
      return jsonResponse({ error: result.error, message: result.message }, result.status);
    }

    const providerStatus = result.providerStatus === 'cached' ? 'cache_hit' : 'provider_fetch';
    console.info('barcode_lookup', {
      barcode: result.data.barcode,
      cacheOutcome: result.cacheOutcome,
      providerStatus,
      completenessStatus: result.data.completenessStatus,
      resultStatus: result.data.completenessStatus === 'complete' ? 'found' : 'incomplete',
      durationMs: Date.now() - startedAt,
    });

    return jsonResponse(result.data, 200);
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      console.info('barcode_lookup', {
        barcode: 'unknown',
        cacheOutcome: 'none',
        providerStatus: 'timeout',
        resultStatus: 'unavailable',
        durationMs: Date.now() - startedAt,
      });
      return jsonResponse({ error: 'unavailable', message: 'Open Food Facts request timed out.' }, 502);
    }

    console.error('barcode_lookup_error', {
      message: err instanceof Error ? err.message : String(err),
      resultStatus: 'internal_error',
      durationMs: Date.now() - startedAt,
    });
    return jsonResponse({ error: 'unavailable', message: 'Internal error' }, 500);
  }
});
