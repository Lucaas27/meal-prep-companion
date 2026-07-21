export const queryKeys = {
  recipes: {
    all: ['recipes'] as const,
    detail: (id: string) => ['recipes', id] as const,
  },
  ingredients: {
    all: ['ingredients'] as const,
    detail: (id: string) => ['ingredients', id] as const,
  },
} as const;
