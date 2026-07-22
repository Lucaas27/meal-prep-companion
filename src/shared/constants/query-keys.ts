export const queryKeys = {
  recipes: {
    all: ['recipes'] as const,
    detail: (id: string) => ['recipes', id] as const,
  },
  ingredients: {
    all: ['ingredients'] as const,
    detail: (id: string) => ['ingredients', id] as const,
    imported: (provider: string, externalId: string) => ['ingredients', 'imported', provider, externalId] as const,
  },
  dryToCooked: {
    all: ['dry-to-cooked'] as const,
  },
  mealPlan: {
    all: ['meal-plan'] as const,
    range: (startDate: string, endDate: string) => ['meal-plan', { startDate, endDate }] as const,
  },
} as const;
