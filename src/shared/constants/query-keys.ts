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
  ingredientConversions: {
    all: ['ingredient-unit-conversions'] as const,
    detail: (ingredientId: string) => ['ingredient-unit-conversions', ingredientId] as const,
    batch: (ingredientIds: string[]) => ['ingredient-unit-conversions', 'batch', ...ingredientIds] as const,
  },
  dryToCooked: {
    all: ['dry-to-cooked'] as const,
  },
  mealPlan: {
    all: ['meal-plan'] as const,
    range: (startDate: string, endDate: string) => ['meal-plan', { startDate, endDate }] as const,
  },
  externalFood: {
    search: (query: string, page: number, pageSize: number) => ['external-food-search', query, page, pageSize] as const,
    detail: (provider: string, externalId: string) => ['external-food-details', provider, externalId] as const,
  },
} as const;
