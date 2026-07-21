const VERSION = 'v1';

export const storageKeys = {
  recipes: `meal-prep-recipes-${VERSION}`,
  ingredients: `meal-prep-ingredients-${VERSION}`,
} as const;
