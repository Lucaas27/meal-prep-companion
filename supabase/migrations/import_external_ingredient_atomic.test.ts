import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const migration = readFileSync(
  resolve(process.cwd(), 'supabase/migrations/20260722153236_import_external_ingredient_atomic.sql'),
  'utf8',
);

describe('import_external_ingredient_atomic migration', () => {
  it('derives the authenticated user inside the function and restricts execution', () => {
    expect(migration).toContain('auth.uid()');
    expect(migration).toContain('revoke all on function public.import_external_ingredient_atomic(jsonb) from public;');
    expect(migration).toContain('grant execute on function public.import_external_ingredient_atomic(jsonb) to authenticated;');
  });

  it('checks duplicates per user and provider', () => {
    expect(migration).toContain('where user_id = v_user_id');
    expect(migration).toContain('and source = v_source');
    expect(migration).toContain('and external_source_id = v_external_source_id');
  });
});
