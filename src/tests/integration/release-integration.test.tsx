import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import App from '@/App';

let mockIsAuth = true;

vi.mock('@/infrastructure/supabase/use-auth', () => ({
  useAuth: () => {
    if (mockIsAuth) {
      return { user: { id: 'test-user', email: 'test@test.com' }, session: {}, loading: false, signOut: vi.fn().mockResolvedValue(undefined) };
    }
    return { user: null, session: null, loading: false, signOut: vi.fn().mockResolvedValue(undefined) };
  },
}));

vi.mock('@/infrastructure/supabase/client', () => ({
  getSupabaseClientOrNull: () => ({
    auth: { signInWithOtp: vi.fn().mockResolvedValue({ error: null }), signOut: vi.fn().mockResolvedValue({}) },
  }),
  getSupabaseClient: () => {
    throw new Error('not configured');
  },
}));

function setAuth(authed: boolean) {
  mockIsAuth = authed;
}

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

describe('v1.2 release verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    setAuth(true);
  });

  describe('authentication', () => {
    it('redirects unauthenticated user from /recipes', () => {
      setAuth(false);
      renderApp('/recipes');
      expect(screen.getByText('Sign in to access your recipes and plans.')).toBeDefined();
    });

    it('shows landing page at root when unauthenticated', () => {
      setAuth(false);
      renderApp('/');
      expect(screen.getByText('Get Started')).toBeDefined();
    });
  });

  describe('route rendering', () => {
    it('renders recipe library', () => {
      renderApp('/recipes');
      expect(document.title).toContain('Recipes');
    });

    it('renders ingredient catalogue', () => {
      renderApp('/ingredients');
      expect(document.title).toContain('Catalogue');
    });

    it('renders calculator', () => {
      renderApp('/calculator');
      expect(document.title).toContain('Calculator');
    });

    it('renders planner', () => {
      renderApp('/planner');
      expect(document.title).toContain('Planner');
    });

    it('renders settings', () => {
      renderApp('/settings');
      expect(document.title).toContain('Settings');
    });

    it('renders not found for unknown route', () => {
      renderApp('/nonsense');
      expect(screen.getByText('Page not found')).toBeDefined();
    });
  });
});
