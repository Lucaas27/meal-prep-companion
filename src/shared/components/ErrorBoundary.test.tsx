import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ErrorBoundary } from '@/shared/components/ErrorBoundary';

function CrashingComponent(): never {
  throw new Error('Test crash');
}

function SafeComponent() {
  return <p>Everything is fine</p>;
}

describe('ErrorBoundary', () => {
  it('renders children normally', () => {
    render(
      <MemoryRouter>
        <ErrorBoundary>
          <SafeComponent />
        </ErrorBoundary>
      </MemoryRouter>,
    );
    expect(screen.getByText('Everything is fine')).toBeDefined();
  });

  it('shows fallback and actions on render error', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <MemoryRouter>
        <ErrorBoundary>
          <CrashingComponent />
        </ErrorBoundary>
      </MemoryRouter>,
    );
    expect(screen.getByText('Something went wrong')).toBeDefined();
    expect(screen.getByText('Try again')).toBeDefined();

    const links = screen.getAllByText('Back to Recipes');
    const recipeLink = links.find((l) => l.closest('a')?.getAttribute('href') === '/recipes');
    expect(recipeLink).toBeDefined();

    (console.error as ReturnType<typeof vi.spyOn>).mockRestore();
  });
});
