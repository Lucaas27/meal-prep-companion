import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSupabaseClientOrNull } from '@/infrastructure/supabase/client';
import { Mail, Loader2 } from 'lucide-react';

export default function SignInPage() {
  const supabase = getSupabaseClientOrNull();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async () => {
    if (!supabase || !email.trim()) return;
    setLoading(true);
    setError('');

    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + '/recipes' },
    });

    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  if (!supabase) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground text-sm">
              Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in your .env file.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl">Meal Prep Companion</CardTitle>
          <CardDescription>Sign in to access your recipes and plans.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sent ? (
            <div className="text-center space-y-3">
              <Mail className="h-10 w-10 text-muted-foreground mx-auto" />
              <p className="text-sm font-medium">Check your email</p>
              <p className="text-xs text-muted-foreground">
                We sent a magic link to <strong>{email}</strong>. Click the link to sign in.
              </p>
              <Button variant="outline" size="sm" onClick={() => setSent(false)}>
                Use a different email
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="auth-email" className="text-[13px]">Email</Label>
                <Input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
                  placeholder="you@example.com"
                  autoFocus
                />
              </div>
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button className="w-full" onClick={handleSignIn} disabled={loading || !email.trim()}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
                {loading ? 'Sending...' : 'Send Magic Link'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
