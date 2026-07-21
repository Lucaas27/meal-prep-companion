import { Navigate } from 'react-router-dom';
import { useAuth } from '@/infrastructure/supabase/use-auth';
import LandingPage from '@/features/auth/pages/landing-page';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export function RootRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-3" />
          <p className="text-muted-foreground text-sm">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (user) {
    return <Navigate to="/recipes" replace />;
  }

  return <LandingPage />;
}
