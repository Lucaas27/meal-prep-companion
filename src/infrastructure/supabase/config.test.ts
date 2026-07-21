import { describe, it, expect, vi } from 'vitest';
import { getSupabaseConfig } from './config';

describe('getSupabaseConfig', () => {
  it('reports missing vars when none are set', () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    const { url, anonKey, missing } = getSupabaseConfig();
    expect(url).toBeUndefined();
    expect(anonKey).toBeUndefined();
    expect(missing).toContain('VITE_SUPABASE_URL');
    expect(missing).toContain('VITE_SUPABASE_ANON_KEY');
    vi.unstubAllEnvs();
  });

  it('returns values when all vars are set', () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-key');
    const { url, anonKey, missing } = getSupabaseConfig();
    expect(url).toBe('https://test.supabase.co');
    expect(anonKey).toBe('test-key');
    expect(missing).toHaveLength(0);
    vi.unstubAllEnvs();
  });
});
