import { getDB } from './schema'
import type { BaseCategory, IngredientCategory } from '../types'

type SupplierKey = 'dairy' | 'nuts' | 'sugar'

interface SeedSupplier {
  key: SupplierKey
  name: string
  contact: string
}

interface SeedIngredient {
  name: string
  category: IngredientCategory
  package_price: number
  package_amount: number
  stock_count: number
  stock_unit: string
  supplier_key: SupplierKey | null
}

interface SeedRecipe {
  name: string
  base_category: BaseCategory
  batch_size: number
  ingredients: { ingredient_name: string; amount: number }[]
}

const SUPPLIERS: SeedSupplier[] = [
  { key: 'dairy', name: '한국유제품', contact: '010-1234-5678' },
  { key: 'nuts', name: '넛츠월드', contact: '010-3456-7890' },
  { key: 'sugar', name: '대한제당', contact: '010-2345-6789' },
]

const INGREDIENTS: SeedIngredient[] = [
  {
    name: '우유',
    category: '유제품',
    package_price: 2800,
    package_amount: 1000,
    stock_count: 12,
    stock_unit: '개',
    supplier_key: 'dairy',
  },
  {
    name: '생크림',
    category: '유제품',
    package_price: 6000,
    package_amount: 1000,
    stock_count: 3,
    stock_unit: '개',
    supplier_key: 'dairy',
  },
  {
    name: '설탕',
    category: '당류',
    package_price: 2200,
    package_amount: 1000,
    stock_count: 10,
    stock_unit: '개',
    supplier_key: 'sugar',
  },
  {
    name: '피스타치오페이스트',
    category: '견과',
    package_price: 38000,
    package_amount: 1000,
    stock_count: 1,
    stock_unit: '개',
    supplier_key: 'nuts',
  },
  {
    name: '딸기',
    category: '과일',
    package_price: 8000,
    package_amount: 1000,
    stock_count: 2,
    stock_unit: '개',
    supplier_key: null,
  },
]

const RECIPES: SeedRecipe[] = [
  {
    name: '피스타치오 젤라또',
    base_category: '견과',
    batch_size: 5000,
    ingredients: [
      { ingredient_name: '우유', amount: 2500 },
      { ingredient_name: '생크림', amount: 1000 },
      { ingredient_name: '설탕', amount: 400 },
      { ingredient_name: '피스타치오페이스트', amount: 350 },
    ],
  },
  {
    name: '딸기 소르베',
    base_category: '과일',
    batch_size: 5000,
    ingredients: [
      { ingredient_name: '딸기', amount: 3000 },
      { ingredient_name: '설탕', amount: 600 },
      { ingredient_name: '우유', amount: 500 },
    ],
  },
]

export async function seedDatabase(): Promise<void> {
  const db = await getDB()

  const row = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) AS count FROM recipes',
  )
  if ((row?.count ?? 0) > 0) return

  await db.withTransactionAsync(async () => {
    const supplierIds = new Map<SupplierKey, number>()
    for (const s of SUPPLIERS) {
      const r = await db.runAsync(
        'INSERT INTO suppliers (name, contact) VALUES (?, ?)',
        s.name,
        s.contact,
      )
      supplierIds.set(s.key, r.lastInsertRowId)
    }

    const ingredientIds = new Map<string, number>()
    for (const ing of INGREDIENTS) {
      const pricePerG = ing.package_price / ing.package_amount
      const supplierId =
        ing.supplier_key !== null ? supplierIds.get(ing.supplier_key) ?? null : null
      const r = await db.runAsync(
        `INSERT INTO ingredients
           (name, category, package_price, package_amount, price_per_g,
            stock_count, stock_unit, supplier_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ing.name,
        ing.category,
        ing.package_price,
        ing.package_amount,
        pricePerG,
        ing.stock_count,
        ing.stock_unit,
        supplierId,
      )
      ingredientIds.set(ing.name, r.lastInsertRowId)

      await db.runAsync(
        `INSERT INTO ingredient_price_history
           (ingredient_id, package_price, package_amount)
         VALUES (?, ?, ?)`,
        r.lastInsertRowId,
        ing.package_price,
        ing.package_amount,
      )
    }

    for (const recipe of RECIPES) {
      const r = await db.runAsync(
        'INSERT INTO recipes (name, base_category, batch_size) VALUES (?, ?, ?)',
        recipe.name,
        recipe.base_category,
        recipe.batch_size,
      )
      const recipeId = r.lastInsertRowId

      const versionIngredients: { ingredient_id: number; amount: number }[] = []
      for (const ri of recipe.ingredients) {
        const ingredientId = ingredientIds.get(ri.ingredient_name)
        if (ingredientId === undefined) {
          throw new Error(`Unknown seed ingredient: ${ri.ingredient_name}`)
        }
        await db.runAsync(
          `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount)
           VALUES (?, ?, ?)`,
          recipeId,
          ingredientId,
          ri.amount,
        )
        versionIngredients.push({ ingredient_id: ingredientId, amount: ri.amount })
      }

      const snapshot = {
        name: recipe.name,
        base_category: recipe.base_category,
        batch_size: recipe.batch_size,
        ingredients: versionIngredients,
      }
      await db.runAsync(
        `INSERT INTO recipe_versions (recipe_id, version_no, snapshot_json)
         VALUES (?, ?, ?)`,
        recipeId,
        1,
        JSON.stringify(snapshot),
      )
    }
  })
}
