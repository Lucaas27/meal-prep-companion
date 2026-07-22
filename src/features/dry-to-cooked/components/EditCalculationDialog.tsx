import { useState } from 'react';
import type { SavedCalculation } from '../schemas/saved-calculation.schema';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calculation: SavedCalculation | null;
  onSave: (calc: SavedCalculation) => void;
}

export function EditCalculationDialog({ open, onOpenChange, calculation, onSave }: Props) {
  const [name, setName] = useState(calculation?.name ?? '');
  const [dryWeight, setDryWeight] = useState(calculation ? String(calculation.dryWeight) : '');
  const [cookedWeight, setCookedWeight] = useState(calculation ? String(calculation.cookedWeight) : '');
  const [cal, setCal] = useState(calculation ? String(calculation.dryCaloriesPer100g) : '');
  const [prot, setProt] = useState(calculation ? String(calculation.dryProteinPer100g) : '');
  const [carbs, setCarbs] = useState(calculation ? String(calculation.dryCarbsPer100g) : '');
  const [fat, setFat] = useState(calculation ? String(calculation.dryFatPer100g) : '');
  const [basis, setBasis] = useState(calculation ? String(calculation.nutritionBasis) : '100');
  const [portions, setPortions] = useState(calculation ? String(calculation.portions) : '1');
  const [serving, setServing] = useState(calculation ? String(calculation.dryServingWeight) : '');

  const handleSave = () => {
    if (!calculation || !name.trim()) return;
    onSave({
      ...calculation,
      name: name.trim(),
      dryWeight: Number(dryWeight) || 0,
      cookedWeight: Number(cookedWeight) || 0,
      dryCaloriesPer100g: Number(cal) || 0,
      dryProteinPer100g: Number(prot) || 0,
      dryCarbsPer100g: Number(carbs) || 0,
      dryFatPer100g: Number(fat) || 0,
      nutritionBasis: Number(basis) || 100,
      portions: Number(portions) || 1,
      dryServingWeight: Number(serving) || 0,
      updatedAt: Date.now(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Calculation</DialogTitle>
          <DialogDescription>Update the saved values.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ec-name" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Name</Label>
            <Input id="ec-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Basmati Rice" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ec-dry" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Dry weight (g)</Label>
              <Input id="ec-dry" type="number" value={dryWeight} onChange={(e) => setDryWeight(e.target.value)} min="0" step="1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ec-cooked" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">Cooked weight (g)</Label>
              <Input id="ec-cooked" type="number" value={cookedWeight} onChange={(e) => setCookedWeight(e.target.value)} min="0" step="1" />
            </div>
          </div>

          <Separator />

          <div className="flex items-end gap-2">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Nutrition per</span>
            <div className="w-20 space-y-1.5">
              <Input type="number" value={basis} onChange={(e) => setBasis(e.target.value)} min="1" step="1" />
            </div>
            <span className="text-sm text-muted-foreground pb-1.5">g</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ec-cal" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Calories</Label>
              <Input id="ec-cal" type="number" value={cal} onChange={(e) => setCal(e.target.value)} min="0" step="0.1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ec-prot" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Protein (g)</Label>
              <Input id="ec-prot" type="number" value={prot} onChange={(e) => setProt(e.target.value)} min="0" step="0.1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ec-carbs" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Carbs (g)</Label>
              <Input id="ec-carbs" type="number" value={carbs} onChange={(e) => setCarbs(e.target.value)} min="0" step="0.1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ec-fat" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Fat (g)</Label>
              <Input id="ec-fat" type="number" value={fat} onChange={(e) => setFat(e.target.value)} min="0" step="0.1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="ec-portions" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Portions</Label>
              <Input id="ec-portions" type="number" value={portions} onChange={(e) => setPortions(e.target.value)} min="1" step="1" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ec-serving" className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Dry serving (g)</Label>
              <Input id="ec-serving" type="number" value={serving} onChange={(e) => setServing(e.target.value)} min="0" step="1" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
