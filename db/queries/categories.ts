import { getDB } from '../schema'

export async function getAllRecipeCategories(): Promise<string[]> {
  try {
    const db = await getDB()
    const rows = await db.getAllAsync<{ name: string }>(
      'SELECT name FROM recipe_categories ORDER BY name',
    )
    return rows.map((r) => r.name)
  } catch (e) {
    console.error('[categories] getAllRecipeCategories failed:', e)
    throw e
  }
}

export async function getAllIngredientCategories(): Promise<string[]> {
  try {
    const db = await getDB()
    const rows = await db.getAllAsync<{ name: string }>(
      'SELECT name FROM ingredient_categories ORDER BY name',
    )
    return rows.map((r) => r.name)
  } catch (e) {
    console.error('[categories] getAllIngredientCategories failed:', e)
    throw e
  }
}

export async function addRecipeCategory(name: string): Promise<void> {
  try {
    const db = await getDB()
    await db.runAsync(
      'INSERT OR IGNORE INTO recipe_categories (name) VALUES (?)',
      name.trim(),
    )
  } catch (e) {
    console.error('[categories] addRecipeCategory failed:', e)
    throw e
  }
}

export async function addIngredientCategory(name: string): Promise<void> {
  try {
    const db = await getDB()
    await db.runAsync(
      'INSERT OR IGNORE INTO ingredient_categories (name) VALUES (?)',
      name.trim(),
    )
  } catch (e) {
    console.error('[categories] addIngredientCategory failed:', e)
    throw e
  }
}

export async function deleteRecipeCategory(name: string): Promise<void> {
  try {
    const db = await getDB()
    await db.runAsync('DELETE FROM recipe_categories WHERE name = ?', name)
  } catch (e) {
    console.error('[categories] deleteRecipeCategory failed:', e)
    throw e
  }
}

export async function deleteIngredientCategory(name: string): Promise<void> {
  try {
    const db = await getDB()
    await db.runAsync(
      'DELETE FROM ingredient_categories WHERE name = ?',
      name,
    )
  } catch (e) {
    console.error('[categories] deleteIngredientCategory failed:', e)
    throw e
  }
}

export async function getAllPackageUnits(): Promise<string[]> {
  try {
    const db = await getDB()
    const rows = await db.getAllAsync<{ name: string }>(
      'SELECT name FROM package_units ORDER BY name',
    )
    return rows.map((r) => r.name)
  } catch (e) {
    console.error('[categories] getAllPackageUnits failed:', e)
    throw e
  }
}

export async function addPackageUnit(name: string): Promise<void> {
  try {
    const db = await getDB()
    await db.runAsync(
      'INSERT OR IGNORE INTO package_units (name) VALUES (?)',
      name.trim(),
    )
  } catch (e) {
    console.error('[categories] addPackageUnit failed:', e)
    throw e
  }
}

export async function deletePackageUnit(name: string): Promise<void> {
  try {
    const db = await getDB()
    await db.runAsync('DELETE FROM package_units WHERE name = ?', name)
  } catch (e) {
    console.error('[categories] deletePackageUnit failed:', e)
    throw e
  }
}
