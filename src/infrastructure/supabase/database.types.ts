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
          external_source_id: string | null;
          external_source_name: string | null;
          imported_at: string | null;
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
          external_source_id?: string | null;
          external_source_name?: string | null;
          imported_at?: string | null;
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
          external_source_id?: string | null;
          external_source_name?: string | null;
          imported_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: never[];
      };
      recipes: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          portions: number;
          notes: string;
          tags: string[] | null;
          favourite: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          portions: number;
          notes?: string;
          tags?: string[] | null;
          favourite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          portions?: number;
          notes?: string;
          tags?: string[] | null;
          favourite?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: never[];
      };
      recipe_ingredients: {
        Row: {
          id: string;
          recipe_id: string;
          ingredient_id: string | null;
          quantity: number;
          unit: string;
          ingredient_unit_conversion_id: string | null;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          recipe_id: string;
          ingredient_id: string | null;
          quantity: number;
          unit?: string;
          ingredient_unit_conversion_id?: string | null;
          position?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          recipe_id?: string;
          ingredient_id?: string;
          quantity?: number;
          unit?: string;
          ingredient_unit_conversion_id?: string | null;
          position?: number;
          created_at?: string;
        };
        Relationships: never[];
      };
      dry_to_cooked_calculations: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          ingredient_id: string | null;
          dry_weight: number;
          cooked_weight: number;
          calories_per_100g: number;
          protein_per_100g: number;
          carbs_per_100g: number;
          fat_per_100g: number;
          nutrition_basis: number;
          portions: number;
          dry_serving_weight: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          name: string;
          ingredient_id?: string | null;
          dry_weight: number;
          cooked_weight: number;
          calories_per_100g: number;
          protein_per_100g: number;
          carbs_per_100g?: number;
          fat_per_100g?: number;
          nutrition_basis?: number;
          portions?: number;
          dry_serving_weight?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          ingredient_id?: string | null;
          dry_weight?: number;
          cooked_weight?: number;
          calories_per_100g?: number;
          protein_per_100g?: number;
          carbs_per_100g?: number;
          fat_per_100g?: number;
          nutrition_basis?: number;
          portions?: number;
          dry_serving_weight?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: never[];
      };
      data_migrations: {
        Row: {
          id: string;
          user_id: string;
          migration_key: string;
          applied_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          migration_key: string;
          applied_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          migration_key?: string;
          applied_at?: string;
        };
        Relationships: never[];
      };
      meal_plan_entries: {
        Row: {
          id: string;
          user_id: string;
          recipe_id: string;
          planned_date: string;
          meal_slot: string;
          servings: number;
          notes: string | null;
          position: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          recipe_id: string;
          planned_date: string;
          meal_slot: string;
          servings?: number;
          notes?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          recipe_id?: string;
          planned_date?: string;
          meal_slot?: string;
          servings?: number;
          notes?: string | null;
          position?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: never[];
      };
      ingredient_unit_conversions: {
        Row: {
          id: string;
          user_id: string;
          ingredient_id: string | null;
          unit: string;
          label: string;
          grams_per_unit: number;
          is_default: boolean;
          source_type: string;
          external_source_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string;
          ingredient_id: string | null;
          unit: string;
          label: string;
          grams_per_unit: number;
          is_default?: boolean;
          source_type?: string;
          external_source_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          ingredient_id?: string;
          unit?: string;
          label?: string;
          grams_per_unit?: number;
          is_default?: boolean;
          source_type?: string;
          external_source_id?: string | null;
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
