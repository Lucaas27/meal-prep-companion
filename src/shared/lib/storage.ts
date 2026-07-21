import type { ZodSchema } from 'zod';

export function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error('Failed to parse JSON from storage:', err);
    return fallback;
  }
}

export function readValidatedCollection<T>(raw: string | null, schema: ZodSchema, fallback: T[]): T[] {
  const parsed = safeParseJson<unknown[]>(raw, []);
  if (!Array.isArray(parsed)) {
    console.warn('Storage value is not an array, returning fallback.');
    return fallback;
  }

  const valid: T[] = [];
  for (let i = 0; i < parsed.length; i++) {
    const result = schema.safeParse(parsed[i]);
    if (result.success) {
      valid.push(result.data as T);
    } else {
      console.warn(`Skipping invalid record at index ${i}:`, result.error.issues);
    }
  }
  return valid;
}
