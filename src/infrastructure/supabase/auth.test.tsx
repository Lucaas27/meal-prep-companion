import { describe, expect, it, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './auth';
import { getSupabaseClientOrNull } from './client';
import { clearExternalFoodCache } from '@/features/external-catalogue/client';

vi.mock('./client', () => ({
  getSupabaseClientOrNull: vi.fn(),
}));

vi.mock('@/features/external-catalogue/client', () => ({
  clearExternalFoodCache: vi.fn(),
}));

describe('AuthProvider', () => {
  it('clears user-specific query state and external food cache on sign-out', async () => {
    const queryClient = new QueryClient();
    const clear = vi.spyOn(queryClient, 'clear');
    let authHandler: ((event: string, session: unknown) => void) | undefined;

    vi.mocked(getSupabaseClientOrNull).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'user-1' } } } }),
        onAuthStateChange: vi.fn((callback) => {
          authHandler = callback;
          return { data: { subscription: { unsubscribe: vi.fn() } } };
        }),
        signOut: vi.fn(),
      },
    } as never);

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <div>child</div>
        </AuthProvider>
      </QueryClientProvider>,
    );

    authHandler?.('SIGNED_OUT', null);

    await waitFor(() => expect(clear).toHaveBeenCalled());
    expect(clearExternalFoodCache).toHaveBeenCalled();
  });
});
