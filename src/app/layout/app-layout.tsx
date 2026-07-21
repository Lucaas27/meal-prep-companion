import type { ReactNode } from 'react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Sun, Moon, Download } from 'lucide-react';
import { exportBackup } from '@/application-services/backup-service';
import { toast } from 'sonner';

export function AppLayout({ children }: { children: ReactNode }) {
  const { theme, setTheme } = useTheme();

  const handleExport = () => {
    try {
      exportBackup();
      toast.success('Backup downloaded!');
    } catch {
      toast.error('Could not create backup.');
    }
  };

  return (
    <div className="min-h-svh">
      <div className="mx-auto max-w-2xl px-5 py-8 pb-20">
        <header className="text-center py-10 relative">
          <h1 className="text-[32px] font-bold tracking-tight leading-tight">
            Meal Prep Companion
          </h1>
          <p className="text-[15px] text-muted-foreground mt-2">
            Plan your batch cooking with precise nutrition
          </p>

          <div className="absolute right-0 top-0 flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground"
                  onClick={handleExport}
                >
                  <Download className="h-[18px] w-[18px]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Export backup</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-muted-foreground"
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
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
