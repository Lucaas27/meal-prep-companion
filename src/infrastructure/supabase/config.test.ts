import { describe, it, expect, vi } from 'vitest';
import { getSupabaseConfig } from './config';

describe('getSupabaseConfig', () => {
  it('reports missing vars when none are set', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');
    const { url, publishableKey, missing } = getSupabaseConfig();
    expect(url).toBeUndefined();
    expect(publishableKey).toBeUndefined();
    expect(missing).toContain('VITE_SUPABASE_URL');
    expect(missing).toContain('VITE_SUPABASE_PUBLISHABLE_KEY');
    vi.unstubAllEnvs();
  });

  it('returns values when all vars are set', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test');
    const { url, publishableKey, missing } = getSupabaseConfig();
    expect(url).toBe('https://test.supabase.co');
    expect(publishableKey).toBe('sb_publishable_test');
    expect(missing).toHaveLength(0);
    vi.unstubAllEnvs();
  });
});
