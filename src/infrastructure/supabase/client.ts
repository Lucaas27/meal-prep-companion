import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { validateSupabaseConfig } from './config';

let clientInstance: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseClient() {
  if (clientInstance) return clientInstance;

  const config = validateSupabaseConfig();
  if (!config) {
    throw new Error(
      'Supabase client not available. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set.',
    );
  }

  clientInstance = createClient<Database>(config.url, config.publishableKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });

  return clientInstance;
}

export function getSupabaseClientOrNull() {
  try {
    return getSupabaseClient();
  } catch {
    return null;
  }
}
