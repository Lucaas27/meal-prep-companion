import { useState, useEffect } from 'react';
import { useAuth } from '@/infrastructure/supabase/use-auth';
import { getSupabaseClientOrNull } from '@/infrastructure/supabase/client';
import {
  getMigrationStatus,
  runMigration,
  downloadBackup,
  clearLocalData,
  type MigrationStatus,
} from '@/application-services/migration-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Database, Download, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

const DISMISS_KEY = 'migration-banner-dismissed';

export function MigrationPrompt() {
  const { user } = useAuth();
  const supabase = getSupabaseClientOrNull();
  const [status, setStatus] = useState<MigrationStatus | null>(null);
  const initialLoading = !!(user && supabase);
  const [loading, setLoading] = useState(initialLoading);
  const [migrating, setMigrating] = useState(false);
  const [done, setDone] = useState(false);
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(DISMISS_KEY) === 'true');

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true');
    setDismissed(true);
  };

  useEffect(() => {
    if (!user || !supabase) return;
    getMigrationStatus().then(setStatus).catch(() => {}).finally(() => setLoading(false));
  }, [user, supabase]);

  if (loading || !status || !status.hasLocalData || status.alreadyMigrated || !user || done || dismissed) {
    return null;
  }

  const handleMigrate = async () => {
    setMigrating(true);
    try {
      const result = await runMigration();
      setDone(true);
      toast.success(
        `Migrated ${result.ingredients} ingredients, ${result.recipes} recipes, ${result.calculations} calculations.`,
      );
    } catch (err) {
      toast.error('Migration failed. Your local data is preserved — try again.');
      console.error('Migration error:', err);
    } finally {
      setMigrating(false);
    }
  };

  const handleClearLocal = () => {
    if (confirm('Delete all local browser data? This will not affect your migrated Supabase data.')) {
      clearLocalData();
      toast.success('Local data cleared.');
      setDone(true);
    }
  };

  return (
    <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/50">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
            <Database className="h-4 w-4" />
            Local Data Found
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7 -mt-1 -mr-1 text-muted-foreground" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <CardDescription>
          You have data stored in this browser that can be migrated to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div className="bg-background rounded-md p-2">
            <span className="block font-semibold">{status.counts.ingredients}</span>
            <span className="text-[10px] text-muted-foreground">Ingredients</span>
          </div>
          <div className="bg-background rounded-md p-2">
            <span className="block font-semibold">{status.counts.recipes}</span>
            <span className="text-[10px] text-muted-foreground">Recipes</span>
          </div>
          <div className="bg-background rounded-md p-2">
            <span className="block font-semibold">{status.counts.calculations}</span>
            <span className="text-[10px] text-muted-foreground">Calculations</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={downloadBackup}>
            <Download className="h-4 w-4 mr-1.5" />
            Download Backup
          </Button>
          <Button size="sm" onClick={handleMigrate} disabled={migrating}>
            {migrating && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            Migrate to Account
          </Button>
        </div>

        {done && (
          <Button size="sm" variant="outline" className="text-destructive" onClick={handleClearLocal}>
            <Trash2 className="h-4 w-4 mr-1.5" />
            Clear Local Data
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
