export interface Database {
  public: {
    Tables: {
      ingredients: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          normalized_name: string;
          calories_per_100g: number;
          protein_per_100g: number;
          carbs_per_100g: number;
          fat_per_100g: number;
          category: string | null;
          source: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          normalized_name: string;
          calories_per_100g: number;
          protein_per_100g: number;
          carbs_per_100g?: number;
          fat_per_100g?: number;
          category?: string | null;
          source?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          normalized_name?: string;
          calories_per_100g?: number;
          protein_per_100g?: number;
          carbs_per_100g?: number;
          fat_per_100g?: number;
          category?: string | null;
          source?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: never[];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
