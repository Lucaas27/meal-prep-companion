export interface ExternalFoodSearchResult {
  provider: string;
  externalId: string;
  name: string;
  description: string | null;
  brand: string | null;
  dataType: string | null;
  caloriesPer100g: number | null;
  proteinPer100g: number | null;
  carbohydratesPer100g: number | null;
  fatPer100g: number | null;
}

export interface ExternalServingOption {
  label: string;
  unit: string;
  gramsPerUnit: number;
  sourceDescription: string | null;
}

export interface ExternalFoodDetails extends ExternalFoodSearchResult {
  category: string | null;
  servingOptions: ExternalServingOption[];
  sourceUrl: string | null;
  retrievedAt: string;
}

export type ExternalFoodProvider = 'usda' | 'open-food-facts';

export type BarcodeProductCompletenessStatus =
  | 'complete'
  | 'partial'
  | 'missing_name'
  | 'missing_nutrition';

export interface ExternalBarcodeFoodDetails extends ExternalFoodDetails {
  provider: 'open-food-facts';
  barcode: string;
  imageUrl: string | null;
  packageQuantityText: string | null;
  servingSizeText: string | null;
  servingQuantityGrams: number | null;
  fibrePer100g: number | null;
  saltPer100g: number | null;
  sodiumPer100g: number | null;
  completenessStatus: BarcodeProductCompletenessStatus;
}

export interface ExternalBarcodeLookupRequest {
  barcode: string;
}

export type ExternalBarcodeLookupState =
  | 'idle'
  | 'looking_up'
  | 'found'
  | 'not_found'
  | 'incomplete'
  | 'rate_limited'
  | 'unavailable';

export interface ExternalFoodSearchPage {
  items: ExternalFoodSearchResult[];
  totalHits: number;
  currentPage: number;
  totalPages: number;
}

export type ProviderErrorCode =
  | 'invalid_query'
  | 'unauthenticated'
  | 'rate_limited'
  | 'unavailable'
  | 'invalid_response'
  | 'not_found';

export class ProviderError extends Error {
  public readonly code: ProviderErrorCode;
  public readonly provider: string;
  public readonly cause?: unknown;

  constructor(code: ProviderErrorCode, message: string, provider: string, cause?: unknown) {
    super(message);
    this.code = code;
    this.provider = provider;
    this.cause = cause;
  }
}

export interface ExternalFoodCatalogue {
  search(query: string, page?: number): Promise<ExternalFoodSearchPage>;
  getDetails(externalId: string): Promise<ExternalFoodDetails>;
}
