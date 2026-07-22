export function round1dp(n: number): number {
  return Math.round(n * 10) / 10;
}

export function formatNutrient(v: number): string {
  const n = Math.max(0, v);
  if (n < 1) return n.toFixed(2);
  return String(Math.ceil(n));
}

export function normaliseName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}
