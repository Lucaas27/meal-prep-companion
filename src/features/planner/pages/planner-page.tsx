import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from 'lucide-react';

export default function PlannerPage() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <Calendar className="h-12 w-12 text-muted-foreground/40 mb-4" />
        <p className="text-muted-foreground text-sm mb-1 font-medium">Meal Planner</p>
        <p className="text-muted-foreground text-xs">Coming in v1.2</p>
      </CardContent>
    </Card>
  );
}
