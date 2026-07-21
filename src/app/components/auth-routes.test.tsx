import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import App from '@/App';

vi.mock('@/infrastructure/supabase/use-auth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/infrastructure/supabase/client', () => ({
  getSupabaseClientOrNull: () => ({
    auth: {
      signInWithOtp: vi.fn().mockResolvedValue({ error: null }),
      signOut: vi.fn().mockResolvedValue({}),
    },
  }),
  getSupabaseClient: () => {
    throw new Error('not configured');
  },
}));

import { useAuth } from '@/infrastructure/supabase/use-auth';

const mockUseAuth = vi.mocked(useAuth);

function renderApp(route = '/recipes') {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <TooltipProvider>
        <MemoryRouter initialEntries={[route]}>
          <App />
        </MemoryRouter>
      </TooltipProvider>
      <Toaster />
    </QueryClientProvider>,
  );
}

function setAuth(user: boolean, loading = false) {
  mockUseAuth.mockReturnValue({
    user: user ? { id: 'test-user', email: 'test@test.com' } as never : null,
    session: user ? {} as never : null,
    loading,
    signOut: vi.fn().mockResolvedValue(undefined),
  });
}

describe('auth routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to sign-in when unauthenticated', () => {
    setAuth(false);
    renderApp('/recipes');
    expect(screen.getByText('Send Magic Link')).toBeDefined();
  });

  it('shows loading state while restoring session', () => {
    setAuth(false, true);
    renderApp('/recipes');
    expect(screen.getByText('Loading...')).toBeDefined();
  });

  it('renders protected route when authenticated', () => {
    setAuth(true);
    renderApp('/recipes');
    expect(document.title).toContain('Recipes');
  });

  it('sign-in page is accessible without auth', () => {
    setAuth(false);
    renderApp('/sign-in');
    expect(screen.getAllByText('Send Magic Link').length).toBeGreaterThan(0);
  });

  it('otherwise-unknown route shows not found', () => {
    setAuth(true);
    renderApp('/nonsense');
    expect(screen.getByText('Page not found')).toBeDefined();
  });
});
