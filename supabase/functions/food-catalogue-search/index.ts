import { z } from 'npm:zod';

const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1';

const searchRequestSchema = z.object({
  query: z.string().trim().min(1).max(200),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

const usdaSearchFoodSchema = z.object({
  fdcId: z.number().int(),
  description: z.string(),
  brandName: z.string().optional(),
  dataType: z.string().optional(),
  foodNutrients: z
    .array(
      z.object({
        nutrientId: z.number().int().optional(),
        nutrientName: z.string().optional(),
        value: z.number().optional(),
      }),
    )
    .optional(),
});

const usdaSearchResponseSchema = z.object({
  foods: z.array(usdaSearchFoodSchema),
  totalHits: z.number().int().min(0).optional(),
});

interface UsdaFood {
  fdcId: number;
  description: string;
  brandName?: string;
  dataType?: string;
  foodNutrients?: { nutrientId?: number; nutrientName?: string; value?: number }[];
}

function mapUsdaResult(food: UsdaFood) {
  const getNutrient = (id: number) => {
    const n = food.foodNutrients?.find((fn) => fn.nutrientId === id);
    return n?.value ?? null;
  };

  return {
    provider: 'usda' as const,
    externalId: String(food.fdcId),
    name: food.description,
    description: null,
    brand: food.brandName ?? null,
    dataType: food.dataType ?? null,
    caloriesPer100g: getNutrient(1008) ?? getNutrient(2047),
    proteinPer100g: getNutrient(1003),
    carbohydratesPer100g: getNutrient(1005),
    fatPer100g: getNutrient(1004),
  };
}

Deno.serve(async (req: Request) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await req.json();
    const parsed = searchRequestSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'invalid_query', message: parsed.error.issues[0]?.message || 'Invalid request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const { query, page, pageSize } = parsed.data;
    const apiKey = Deno.env.get('USDA_API_KEY');

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'unavailable', message: 'USDA API key not configured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const url = `${USDA_BASE}/foods/search?api_key=${apiKey}&query=${encodeURIComponent(query)}&pageNumber=${page}&pageSize=${pageSize}&dataType=Foundation,SR%20Legacy,Branded`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    let usdaRes: Response;
    try {
      usdaRes = await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }

    if (usdaRes.status === 401 || usdaRes.status === 403) {
      return new Response(
        JSON.stringify({ error: 'unauthenticated', message: 'USDA API authentication failed' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (usdaRes.status === 429) {
      return new Response(
        JSON.stringify({ error: 'rate_limited', message: 'USDA API rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (!usdaRes.ok) {
      return new Response(
        JSON.stringify({ error: 'unavailable', message: `USDA API returned ${usdaRes.status}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const raw = await usdaRes.json();
    const parsedResponse = usdaSearchResponseSchema.safeParse(raw);
    if (!parsedResponse.success) {
      return new Response(
        JSON.stringify({ error: 'invalid_response', message: 'Unexpected USDA response format' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const items = parsedResponse.data.foods.map(mapUsdaResult);
    const totalHits = parsedResponse.data.totalHits ?? items.length;

    return new Response(
      JSON.stringify({
        items,
        totalHits,
        currentPage: page,
        totalPages: Math.max(1, Math.ceil(totalHits / pageSize)),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return new Response(
        JSON.stringify({ error: 'unavailable', message: 'USDA API request timed out' }),
        { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    console.error('USDA search error:', err instanceof Error ? err.message : err);
    return new Response(
      JSON.stringify({ error: 'unavailable', message: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
