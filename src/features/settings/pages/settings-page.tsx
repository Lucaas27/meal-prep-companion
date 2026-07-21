import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { exportBackup } from '@/application-services/backup-service';
import { toast } from 'sonner';
import { Download } from 'lucide-react';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  const handleExport = () => {
    try {
      exportBackup();
      toast.success('Backup exported!');
    } catch {
      toast.error('Could not export backup.');
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Manage appearance, data, and preferences.
      </p>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-[15px] font-semibold">Appearance</CardTitle>
          <CardDescription>Choose your preferred theme.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(['light', 'dark', 'system'] as const).map((t) => (
              <Button
                key={t}
                variant={theme === t ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTheme(t)}
                className="capitalize"
              >
                {t}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-[15px] font-semibold">Data</CardTitle>
          <CardDescription>Export a backup of your data.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            <Label className="text-[13px]">Backup</Label>
            <p className="text-xs text-muted-foreground mb-3">
              Your data is stored in this browser. Export a backup to keep a copy or move it to another browser.
            </p>
            <Button onClick={handleExport} size="sm">
              <Download className="h-4 w-4 mr-1.5" />
              Export Data
            </Button>
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-[15px] font-semibold">About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">Meal Prep Companion</p>
            <p>Plan recipes, manage reusable ingredients and calculate cooked serving weights.</p>
          </div>
          <div>
            <p>Your recipes, ingredients, saved calculations and preferences are stored in this browser only. No account is required and no data is sent to a server. Clearing browser storage may remove your data, so export a backup if you want to keep a separate copy.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
