import type { ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sun, Moon } from 'lucide-react';

export function AppLayout({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-svh">
      <div className="mx-auto max-w-2xl px-5 pt-6 pb-20">
        <header className="text-center py-6 relative">
          <h1 className="text-[32px] font-bold tracking-tight leading-tight">
            Meal Prep Companion
          </h1>
          <p className="text-[15px] text-muted-foreground mt-2">
            Plan your batch cooking with precise nutrition
          </p>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-9 w-9 text-muted-foreground"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? (
                  <Sun className="h-[18px] w-[18px]" />
                ) : (
                  <Moon className="h-[18px] w-[18px]" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            </TooltipContent>
          </Tooltip>
        </header>
        {children}
      </div>
    </div>
  );
}
