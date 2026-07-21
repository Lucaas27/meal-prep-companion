export function round1dp(n: number): number {
  return Math.round(n * 10) / 10;
}

export function normaliseName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}
