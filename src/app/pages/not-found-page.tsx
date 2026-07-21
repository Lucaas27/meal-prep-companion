import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <FileQuestion className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground text-sm mb-1 font-medium">Page not found</p>
        <p className="text-muted-foreground text-xs mb-4">The page you're looking for doesn't exist.</p>
        <Button asChild>
          <Link to="/recipes">Back to Recipes</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
