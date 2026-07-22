import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sun, Moon, LogOut } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { NAV_ITEMS } from '@/shared/constants/nav-items';
import { useAuth } from '@/infrastructure/supabase/use-auth';

export function AppShell({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();

  const visibleItems = user ? NAV_ITEMS : [];

  return (
    <div className="min-h-svh flex flex-col md:flex-row">
      {user && (
      <aside className="hidden md:flex flex-col w-[240px] border-r bg-card shrink-0 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.06] to-transparent pointer-events-none" />
        <div className="px-5 pt-6 pb-5 border-b border-border/50 relative">
          <h1 className="text-lg font-display font-semibold tracking-tight text-primary">Meal Prep Companion</h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-body">Batch cooking with precision nutrition</p>
        </div>

        <nav className="flex-1 px-2.5 py-3 space-y-1">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-150 font-body',
                  isActive
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-border/50 flex items-center justify-between">
          {user && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={signOut}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">Sign out</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
      )}

      <div className="flex-1 flex flex-col min-w-0 font-body">
        <header className="md:hidden text-center pt-6 pb-2 mb-4 relative border-b border-border/50">
          <h1 className="text-xl font-display font-semibold tracking-tight text-primary">Meal Prep Companion</h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-body">Batch cooking with precision nutrition</p>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-6 h-8 w-8 text-muted-foreground"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            </TooltipContent>
          </Tooltip>
        </header>

        <main className="flex-1 px-5 pb-20 md:pb-8 md:pt-6">
          {children}
        </main>

        {user && (
        <nav className="md:hidden fixed bottom-0 inset-x-0 border-t bg-card flex items-center justify-around pb-safe shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 py-2 px-1 text-[11px] font-medium transition-colors min-w-0',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground',
                )
              }
            >
              <item.icon className="h-5 w-5" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        )}
      </div>
    </div>
  );
}
