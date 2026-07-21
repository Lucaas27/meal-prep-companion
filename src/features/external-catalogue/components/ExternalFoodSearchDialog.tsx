import { useState, useEffect } from 'react';
import { useFoodSearch, useFoodDetails } from '../hooks';
import type { ExternalFoodSearchResult } from '../types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Search, AlertTriangle, ChevronLeft, Database } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExternalFoodSearchDialog({ open, onOpenChange }: Props) {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: pageData, isLoading, error } = useFoodSearch(debouncedQuery, page);
  const { data: details, isLoading: detailsLoading } = useFoodDetails('usda', selectedId || '');

  const handleLoadMore = () => setPage((p) => p + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            {selectedId ? (details?.name || 'Food Details') : 'Import Food'}
          </DialogTitle>
          <DialogDescription>
            {selectedId ? 'Review nutrition before importing.' : 'Search USDA FoodData Central.'}
          </DialogDescription>
        </DialogHeader>

        {selectedId ? (
          <div className="space-y-4">
            <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back to results
            </Button>

            {detailsLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {details && (
              <ScrollArea className="max-h-[50vh]">
                <div className="space-y-3 pr-4">
                  <div>
                    <h3 className="font-semibold">{details.name}</h3>
                    {details.brand && <p className="text-sm text-muted-foreground">{details.brand}</p>}
                    <div className="flex gap-1.5 mt-1.5">
                      {details.dataType && <Badge variant="outline" className="text-[10px]">{details.dataType}</Badge>}
                      <Badge variant="secondary" className="text-[10px]">USDA</Badge>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Nutrition (per 100g)</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <NutritionItem label="Calories" value={details.caloriesPer100g} unit="kcal" />
                      <NutritionItem label="Protein" value={details.proteinPer100g} unit="g" />
                      <NutritionItem label="Carbs" value={details.carbohydratesPer100g} unit="g" />
                      <NutritionItem label="Fat" value={details.fatPer100g} unit="g" />
                    </div>
                  </div>

                  {details.servingOptions.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Serving Options</Label>
                        <div className="space-y-1 mt-2">
                          {details.servingOptions.map((s, i) => (
                            <div key={i} className="text-xs text-muted-foreground">
                              <span className="font-medium">{s.label}</span> — {s.gramsPerUnit}g
                              {s.sourceDescription && <span className="block text-[10px]">{s.sourceDescription}</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {details.sourceUrl && (
                    <p className="text-[10px] text-muted-foreground">
                      Source: <a href={details.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">USDA FoodData Central</a>
                    </p>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        ) : (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search USDA foods..."
                className="pl-9"
                autoFocus
              />
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive">
                  {error.message?.includes('rate_limited') ? 'USDA API rate limit reached. Try again later.' : 'Search failed. Try again.'}
                </p>
              </div>
            )}

            {pageData && pageData.items.length === 0 && debouncedQuery.length >= 2 && (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-sm text-muted-foreground">No results found for "{debouncedQuery}".</p>
              </div>
            )}

            {pageData && pageData.items.length > 0 && (
              <ScrollArea className="max-h-[50vh]">
                <div className="space-y-1.5 pr-4">
                  {pageData.items.map((item) => (
                    <ResultRow key={item.externalId} item={item} onClick={() => setSelectedId(item.externalId)} />
                  ))}

                  {pageData.totalPages > page && (
                    <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={handleLoadMore} disabled={isLoading}>
                      Load more ({pageData.totalHits - page * 20} remaining)
                    </Button>
                  )}
                </div>
              </ScrollArea>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ResultRow({ item, onClick }: { item: ExternalFoodSearchResult; onClick: () => void }) {
  return (
    <button
      className="w-full text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{item.name}</p>
          {item.brand && <p className="text-[11px] text-muted-foreground truncate">{item.brand}</p>}
          <div className="flex gap-1 mt-1">
            {item.dataType && <Badge variant="outline" className="text-[10px]">{item.dataType}</Badge>}
            <Badge variant="secondary" className="text-[10px]">USDA</Badge>
          </div>
        </div>
        <div className="text-right shrink-0">
          {item.caloriesPer100g != null ? (
            <span className="text-xs font-medium">{item.caloriesPer100g} kcal</span>
          ) : (
            <span className="text-[10px] text-muted-foreground">— kcal</span>
          )}
          <br />
          {item.proteinPer100g != null ? (
            <span className="text-xs font-medium">{item.proteinPer100g}g P</span>
          ) : (
            <span className="text-[10px] text-muted-foreground">— P</span>
          )}
        </div>
      </div>
    </button>
  );
}

function NutritionItem({ label, value, unit }: { label: string; value: number | null; unit: string }) {
  return (
    <div className="rounded-md bg-muted/50 p-2">
      <span className="block text-sm font-semibold">{value != null ? value : '—'}</span>
      <span className="block text-[10px] text-muted-foreground">{label} {value != null ? unit : ''}</span>
    </div>
  );
}
