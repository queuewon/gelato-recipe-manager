export type BaseCategory =
  | '과일'
  | '차'
  | '곡물'
  | '견과'
  | '술'
  | '초콜릿'
  | '기타'

export type IngredientCategory =
  | '유제품'
  | '과일'
  | '견과'
  | '당류'
  | '차'
  | '기타'

export type ChecklistStatus = 'pending' | 'in_progress' | 'done'

export interface Recipe {
  id: number
  name: string
  base_category: BaseCategory
  batch_size: number
  memo?: string
  is_deleted: number
  created_at: string
  updated_at: string
}

export interface RecipeWithIngredients extends Recipe {
  ingredients: RecipeIngredientDetail[]
}

export interface RecipeIngredientDetail {
  id: number
  recipe_id: number
  ingredient_id: number
  amount: number
  ingredient: Ingredient
}

export interface RecipeVersion {
  id: number
  recipe_id: number
  version_no: number
  snapshot_json: string
  created_at: string
}

export interface Ingredient {
  id: number
  name: string
  category: IngredientCategory
  package_price: number
  package_amount: number
  price_per_g: number
  stock_count: number
  stock_unit: string
  supplier_id?: number
  created_at: string
}

export interface IngredientPriceHistory {
  id: number
  ingredient_id: number
  package_price: number
  package_amount: number
  recorded_at: string
}

export interface Supplier {
  id: number
  name: string
  contact?: string
  memo?: string
}

export interface IngredientSupplier {
  id: number
  ingredient_id: number
  supplier_id: number
}

export interface DailyChecklist {
  id: number
  recipe_id: number
  date: string
  batch_size: number
  status: ChecklistStatus
  completed_at?: string
  recipe?: Recipe
}
