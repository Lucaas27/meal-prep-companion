import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import App from '@/App';

function renderRoute(route: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <TooltipProvider>
        <MemoryRouter initialEntries={[route]}>
          <App />
        </MemoryRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>,
  );
}

describe('routes', () => {
  it('redirects / to /recipes', () => {
    renderRoute('/');
    expect(document.title).toContain('Recipes');
  });

  it('renders recipes at /recipes', () => {
    renderRoute('/recipes');
    expect(document.title).toContain('Recipes');
  });

  it('renders planner at /planner', () => {
    renderRoute('/planner');
    expect(screen.getByText('Meal Planner')).toBeDefined();
    expect(document.title).toContain('Planner');
  });

  it('renders calculator at /calculator', () => {
    renderRoute('/calculator');
    expect(document.title).toContain('Calculator');
  });

  it('renders catalogue at /ingredients', () => {
    renderRoute('/ingredients');
    expect(document.title).toContain('Catalogue');
  });

  it('renders settings at /settings', () => {
    renderRoute('/settings');
    expect(document.title).toContain('Settings');
  });

  it('renders not found for unknown route', () => {
    renderRoute('/nonsense');
    expect(screen.getByText('Page not found')).toBeDefined();
    expect(document.title).toContain('Not Found');
  });
});
