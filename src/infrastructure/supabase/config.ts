const requiredVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
] as const;

export function getSupabaseConfig() {
  const url = (import.meta.env.VITE_SUPABASE_URL as string)?.trim() || undefined;
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string)?.trim() || undefined;

  const missing = requiredVars.filter((key) => {
    const val = import.meta.env[key];
    return typeof val !== 'string' || val.trim() === '';
  });

  return { url, anonKey, missing };
}

export function validateSupabaseConfig() {
  const { url, anonKey, missing } = getSupabaseConfig();

  if (missing.length > 0 && import.meta.env.DEV) {
    console.warn(
      `Missing Supabase environment variables: ${missing.join(', ')}. ` +
      'Copy .env.example to .env and fill in your Supabase project values.',
    );
  }

  if (!url || !anonKey) {
    return null;
  }

  return { url, anonKey };
}
