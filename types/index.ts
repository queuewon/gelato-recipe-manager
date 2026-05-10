export type BaseCategory = string
export type IngredientCategory = string

export type ChecklistStatus = 'pending' | 'in_progress' | 'done'

export interface Label {
  name: string
  color: string
}

export interface Recipe {
  id: number
  name: string
  base_category: BaseCategory
  batch_size: number       // g 단위
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
  amount: number           // g 단위
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
  package_price: number    // 한 통 가격 (원)
  package_amount: number   // 한 통 용량 (g)
  price_per_g: number      // g당 가격 (자동 계산)
  stock_count: number      // 재고 개수
  stock_unit: string       // 단위 표시
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
  batch_size: number       // g 단위
  status: ChecklistStatus
  completed_at?: string
  recipe?: Recipe
}
