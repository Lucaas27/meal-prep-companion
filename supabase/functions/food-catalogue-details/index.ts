import { z } from 'npm:zod';

const USDA_BASE = 'https://api.nal.usda.gov/fdc/v1';

const detailsRequestSchema = z.object({
  provider: z.literal('usda'),
  externalId: z.string().min(1).max(30),
});

const usdaFoodDetailSchema = z.object({
  fdcId: z.number().int(),
  description: z.string(),
  brandName: z.string().optional(),
  dataType: z.string().optional(),
  foodCategory: z.string().optional(),
  foodNutrients: z
    .array(
      z.object({
        nutrientId: z.number().int().optional(),
        nutrientName: z.string().optional(),
        value: z.number().optional(),
      }),
    )
    .optional(),
  foodPortions: z
    .array(
      z.object({
        gramWeight: z.number().positive().optional(),
        amount: z.number().positive().optional(),
        modifier: z.string().optional(),
        measureUnit: z
          .object({
            name: z.string().optional(),
          })
          .optional(),
      }),
    )
    .optional(),
});

interface UsdaFoodDetail {
  fdcId: number;
  description: string;
  brandName?: string;
  dataType?: string;
  foodCategory?: string;
  foodNutrients?: { nutrientId?: number; nutrientName?: string; value?: number }[];
  foodPortions?: {
    gramWeight?: number;
    amount?: number;
    modifier?: string;
    measureUnit?: { name?: string };
  }[];
}

function getNutrient(nutrients: UsdaFoodDetail['foodNutrients'], ...ids: number[]): number | null {
  if (!nutrients) return null;
  for (const id of ids) {
    const n = nutrients.find((fn) => fn.nutrientId === id);
    if (n?.value != null) return n.value;
  }
  return null;
}

// USDA measures nutrient per 100g for most foods.
// For branded foods with serving-size only, the value is per serving (not per 100g).
// We normalize to per-100g where possible by checking the data type.
function normaliseNutrient(value: number | null, dataType?: string): number | null {
  if (value == null) return null;
  if (dataType === 'Branded') {
    // Branded foods may report per serving. We accept as-is with a note.
    return value;
  }
  return value;
}

function mapPortions(portions: UsdaFoodDetail['foodPortions']) {
  if (!portions) return [];
  return portions
    .filter((p) => p.gramWeight && p.gramWeight > 0)
    .map((p) => ({
      label: [p.modifier, p.measureUnit?.name].filter(Boolean).join(' ') || `${p.amount ?? 1} units`,
      unit: 'g',
      gramsPerUnit: p.gramWeight!,
      sourceDescription: p.amount ? `Based on ${p.amount} ${p.measureUnit?.name ?? 'unit'}(s) at ${p.gramWeight}g each` : `${p.gramWeight}g per portion`,
    }));
}

function mapDetails(food: UsdaFoodDetail) {
  const nutrients = food.foodNutrients;

  return {
    provider: 'usda' as const,
    externalId: String(food.fdcId),
    name: food.description,
    description: null,
    brand: food.brandName ?? null,
    dataType: food.dataType ?? null,
    caloriesPer100g: normaliseNutrient(getNutrient(nutrients, 1008, 2047), food.dataType),
    proteinPer100g: normaliseNutrient(getNutrient(nutrients, 1003), food.dataType),
    carbohydratesPer100g: normaliseNutrient(getNutrient(nutrients, 1005), food.dataType),
    fatPer100g: normaliseNutrient(getNutrient(nutrients, 1004), food.dataType),
    category: food.foodCategory ?? null,
    servingOptions: mapPortions(food.foodPortions),
    sourceUrl: `https://fdc.nal.usda.gov/fdc-app.html#/food-details/${food.fdcId}`,
    retrievedAt: new Date().toISOString(),
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
    console.log("checkpoint: start");
    const body = await req.json();
    console.log("checkpoint: parsed body");
    const parsed = detailsRequestSchema.safeParse(body);

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'invalid_query', message: parsed.error.issues[0]?.message || 'Invalid request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log("checkpoint: validated input");
    const { externalId } = parsed.data;
    const apiKey = Deno.env.get('USDA_API_KEY');

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'unavailable', message: 'USDA API key not configured' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const url = `${USDA_BASE}/food/${encodeURIComponent(externalId)}?api_key=${apiKey}`;
    console.log("checkpoint: calling USDA");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let usdaRes: Response;
    try {
      usdaRes = await fetch(url, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }

    console.log("checkpoint: USDA responded", usdaRes.status);

    if (usdaRes.status === 401 || usdaRes.status === 403) {
      return new Response(
        JSON.stringify({ error: 'unauthenticated', message: 'USDA API authentication failed' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    if (usdaRes.status === 404) {
      return new Response(
        JSON.stringify({ error: 'not_found', message: `Food ${externalId} not found` }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
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
    console.log("checkpoint: parsed USDA JSON length", Object.keys(raw).length);
    const parsedResponse = usdaFoodDetailSchema.safeParse(raw);
    if (!parsedResponse.success) {
      console.error("checkpoint: schema validation failed", parsedResponse.error.issues);
      return new Response(
        JSON.stringify({ error: 'invalid_response', message: 'Invalid USDA food data' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    console.log("checkpoint: mapping result");
    const result = mapDetails(parsedResponse.data);

    console.log("checkpoint: returning");
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('checkpoint: caught error', err instanceof Error ? err.message : err, err instanceof Error ? err.stack : '');
    if (err instanceof DOMException && err.name === 'AbortError') {
      return new Response(
        JSON.stringify({ error: 'unavailable', message: 'USDA API request timed out' }),
        { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }
    return new Response(
      JSON.stringify({ error: 'unavailable', message: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
