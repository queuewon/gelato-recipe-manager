import type { SQLiteBindValue } from 'expo-sqlite'
import { getDB } from '../schema'
import type {
  BaseCategory,
  Ingredient,
  Recipe,
  RecipeIngredientDetail,
  RecipeVersion,
  RecipeWithIngredients,
} from '../../types'

interface RecipeIngredientRow {
  id: number
  recipe_id: number
  ingredient_id: number
  amount: number
}

interface RecipeSnapshot {
  name: string
  base_category: BaseCategory
  batch_size: number
  memo?: string
  ingredients: { ingredient_id: number; amount: number }[]
}

const RECIPE_UPDATABLE_COLUMNS = [
  'name',
  'base_category',
  'batch_size',
  'memo',
  'is_deleted',
] as const

export async function getAllRecipes(): Promise<Recipe[]> {
  try {
    const db = await getDB()
    return await db.getAllAsync<Recipe>(
      'SELECT * FROM recipes WHERE is_deleted = 0 ORDER BY updated_at DESC',
    )
  } catch (e) {
    console.error('[recipes] getAllRecipes failed:', e)
    throw e
  }
}

export async function getRecipeById(
  id: number,
): Promise<RecipeWithIngredients | null> {
  try {
    const db = await getDB()
    const recipe = await db.getFirstAsync<Recipe>(
      'SELECT * FROM recipes WHERE id = ? AND is_deleted = 0',
      id,
    )
    if (!recipe) return null

    const rows = await db.getAllAsync<RecipeIngredientRow>(
      'SELECT id, recipe_id, ingredient_id, amount FROM recipe_ingredients WHERE recipe_id = ?',
      id,
    )
    if (rows.length === 0) {
      return { ...recipe, ingredients: [] }
    }

    const ingIds = rows.map((r) => r.ingredient_id)
    const placeholders = ingIds.map(() => '?').join(',')
    const ings = await db.getAllAsync<Ingredient>(
      `SELECT * FROM ingredients WHERE id IN (${placeholders})`,
      ingIds,
    )
    const ingMap = new Map<number, Ingredient>(ings.map((i) => [i.id, i]))

    const ingredients: RecipeIngredientDetail[] = rows.map((r) => {
      const ingredient = ingMap.get(r.ingredient_id)
      if (!ingredient) {
        throw new Error(
          `Ingredient ${r.ingredient_id} not found for recipe ${id}`,
        )
      }
      return {
        id: r.id,
        recipe_id: r.recipe_id,
        ingredient_id: r.ingredient_id,
        amount: r.amount,
        ingredient,
      }
    })

    return { ...recipe, ingredients }
  } catch (e) {
    console.error('[recipes] getRecipeById failed:', e)
    throw e
  }
}

export async function createRecipe(
  data: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>,
  ingredients: { ingredient_id: number; amount: number }[],
): Promise<number> {
  try {
    const db = await getDB()
    let recipeId = 0
    await db.withTransactionAsync(async () => {
      const r = await db.runAsync(
        `INSERT INTO recipes (name, base_category, batch_size, memo, is_deleted)
         VALUES (?, ?, ?, ?, ?)`,
        data.name,
        data.base_category,
        data.batch_size,
        data.memo ?? null,
        data.is_deleted ?? 0,
      )
      recipeId = r.lastInsertRowId

      for (const ing of ingredients) {
        await db.runAsync(
          'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount) VALUES (?, ?, ?)',
          recipeId,
          ing.ingredient_id,
          ing.amount,
        )
      }

      const snapshot: RecipeSnapshot = {
        name: data.name,
        base_category: data.base_category,
        batch_size: data.batch_size,
        memo: data.memo,
        ingredients,
      }
      await db.runAsync(
        'INSERT INTO recipe_versions (recipe_id, version_no, snapshot_json) VALUES (?, ?, ?)',
        recipeId,
        1,
        JSON.stringify(snapshot),
      )
    })
    return recipeId
  } catch (e) {
    console.error('[recipes] createRecipe failed:', e)
    throw e
  }
}

export async function updateRecipe(
  id: number,
  data: Partial<Recipe>,
  ingredients?: { ingredient_id: number; amount: number }[],
): Promise<void> {
  try {
    const db = await getDB()
    await db.withTransactionAsync(async () => {
      const sets: string[] = []
      const values: SQLiteBindValue[] = []
      for (const col of RECIPE_UPDATABLE_COLUMNS) {
        const v = data[col]
        if (v !== undefined) {
          sets.push(`${col} = ?`)
          values.push(v as SQLiteBindValue)
        }
      }
      sets.push("updated_at = datetime('now', 'localtime')")
      const setClause = sets.join(', ')
      const updateValues: SQLiteBindValue[] = [...values, id]
      await db.runAsync(
        `UPDATE recipes SET ${setClause} WHERE id = ?`,
        updateValues,
      )

      if (ingredients) {
        await db.runAsync(
          'DELETE FROM recipe_ingredients WHERE recipe_id = ?',
          id,
        )
        for (const ing of ingredients) {
          await db.runAsync(
            'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount) VALUES (?, ?, ?)',
            id,
            ing.ingredient_id,
            ing.amount,
          )
        }
      }

      const recipe = await db.getFirstAsync<Recipe>(
        'SELECT * FROM recipes WHERE id = ?',
        id,
      )
      if (!recipe) throw new Error(`Recipe ${id} not found`)

      const currentRows = await db.getAllAsync<{
        ingredient_id: number
        amount: number
      }>(
        'SELECT ingredient_id, amount FROM recipe_ingredients WHERE recipe_id = ?',
        id,
      )

      const maxRow = await db.getFirstAsync<{ max: number | null }>(
        'SELECT MAX(version_no) AS max FROM recipe_versions WHERE recipe_id = ?',
        id,
      )
      const newVersion = (maxRow?.max ?? 0) + 1

      const snapshot: RecipeSnapshot = {
        name: recipe.name,
        base_category: recipe.base_category,
        batch_size: recipe.batch_size,
        memo: recipe.memo,
        ingredients: currentRows.map((c) => ({
          ingredient_id: c.ingredient_id,
          amount: c.amount,
        })),
      }
      await db.runAsync(
        'INSERT INTO recipe_versions (recipe_id, version_no, snapshot_json) VALUES (?, ?, ?)',
        id,
        newVersion,
        JSON.stringify(snapshot),
      )
    })
  } catch (e) {
    console.error('[recipes] updateRecipe failed:', e)
    throw e
  }
}

export async function softDeleteRecipe(id: number): Promise<void> {
  try {
    const db = await getDB()
    await db.runAsync(
      "UPDATE recipes SET is_deleted = 1, updated_at = datetime('now', 'localtime') WHERE id = ?",
      id,
    )
  } catch (e) {
    console.error('[recipes] softDeleteRecipe failed:', e)
    throw e
  }
}

export async function getRecipeVersions(
  recipeId: number,
): Promise<RecipeVersion[]> {
  try {
    const db = await getDB()
    return await db.getAllAsync<RecipeVersion>(
      'SELECT * FROM recipe_versions WHERE recipe_id = ? ORDER BY version_no DESC',
      recipeId,
    )
  } catch (e) {
    console.error('[recipes] getRecipeVersions failed:', e)
    throw e
  }
}

export async function restoreRecipeVersion(versionId: number): Promise<void> {
  try {
    const db = await getDB()
    await db.withTransactionAsync(async () => {
      const v = await db.getFirstAsync<RecipeVersion>(
        'SELECT * FROM recipe_versions WHERE id = ?',
        versionId,
      )
      if (!v) throw new Error(`Version ${versionId} not found`)

      const snap = JSON.parse(v.snapshot_json) as RecipeSnapshot

      await db.runAsync(
        `UPDATE recipes
            SET name = ?, base_category = ?, batch_size = ?, memo = ?,
                updated_at = datetime('now', 'localtime')
          WHERE id = ?`,
        snap.name,
        snap.base_category,
        snap.batch_size,
        snap.memo ?? null,
        v.recipe_id,
      )

      await db.runAsync(
        'DELETE FROM recipe_ingredients WHERE recipe_id = ?',
        v.recipe_id,
      )
      for (const ing of snap.ingredients) {
        await db.runAsync(
          'INSERT INTO recipe_ingredients (recipe_id, ingredient_id, amount) VALUES (?, ?, ?)',
          v.recipe_id,
          ing.ingredient_id,
          ing.amount,
        )
      }

      const maxRow = await db.getFirstAsync<{ max: number | null }>(
        'SELECT MAX(version_no) AS max FROM recipe_versions WHERE recipe_id = ?',
        v.recipe_id,
      )
      const newVersion = (maxRow?.max ?? 0) + 1
      await db.runAsync(
        'INSERT INTO recipe_versions (recipe_id, version_no, snapshot_json) VALUES (?, ?, ?)',
        v.recipe_id,
        newVersion,
        v.snapshot_json,
      )
    })
  } catch (e) {
    console.error('[recipes] restoreRecipeVersion failed:', e)
    throw e
  }
}
