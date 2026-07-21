import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UtensilsCrossed, Scale, Package, Calendar } from 'lucide-react';

const FEATURES = [
  {
    icon: UtensilsCrossed,
    title: 'Recipe Library',
    desc: 'Create, search, and manage meal prep recipes with live nutrition calculations.',
  },
  {
    icon: Package,
    title: 'Ingredient Catalogue',
    desc: 'Save reusable ingredients with per-100g macros for quick recipe building.',
  },
  {
    icon: Scale,
    title: 'Dry-to-Cooked Calculator',
    desc: 'Convert dry weights to cooked equivalents — rice, pasta, grains, and more.',
  },
  {
    icon: Calendar,
    title: 'Meal Planner',
    desc: 'Plan your meals by day and slot. Coming soon.',
  },
];

export default function LandingPage() {
  return (
    <div className="space-y-8 py-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Meal Prep Companion</h1>
        <p className="text-muted-foreground max-w-md mx-auto text-sm">
          Plan your batch cooking with precise nutrition. Create recipes, manage ingredients,
          and calculate cooked serving weights — all in one place.
        </p>
        <Button asChild size="lg">
          <Link to="/sign-in">Get Started</Link>
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {FEATURES.map((f) => (
          <Card key={f.title}>
            <CardContent className="p-5 flex gap-4">
              <f.icon className="h-8 w-8 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm">{f.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Sign in to save your data and access it from any browser.
      </p>
    </div>
  );
}
