import { DEFAULT_LABEL_COLOR_KEY } from '../../constants/colors'
import type { Label } from '../../types'
import { getDB } from '../schema'

export async function getAllRecipeCategories(): Promise<Label[]> {
  try {
    const db = await getDB()
    return await db.getAllAsync<Label>(
      'SELECT name, color FROM recipe_categories ORDER BY name',
    )
  } catch (e) {
    console.error('[categories] getAllRecipeCategories failed:', e)
    throw e
  }
}

export async function getAllIngredientCategories(): Promise<Label[]> {
  try {
    const db = await getDB()
    return await db.getAllAsync<Label>(
      'SELECT name, color FROM ingredient_categories ORDER BY name',
    )
  } catch (e) {
    console.error('[categories] getAllIngredientCategories failed:', e)
    throw e
  }
}

export async function addRecipeCategory(
  name: string,
  color: string = DEFAULT_LABEL_COLOR_KEY,
): Promise<void> {
  try {
    const db = await getDB()
    await db.runAsync(
      'INSERT OR IGNORE INTO recipe_categories (name, color) VALUES (?, ?)',
      name.trim(),
      color,
    )
  } catch (e) {
    console.error('[categories] addRecipeCategory failed:', e)
    throw e
  }
}

export async function addIngredientCategory(
  name: string,
  color: string = DEFAULT_LABEL_COLOR_KEY,
): Promise<void> {
  try {
    const db = await getDB()
    await db.runAsync(
      'INSERT OR IGNORE INTO ingredient_categories (name, color) VALUES (?, ?)',
      name.trim(),
      color,
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

export async function updateRecipeCategoryColor(
  name: string,
  color: string,
): Promise<void> {
  try {
    const db = await getDB()
    await db.runAsync(
      'UPDATE recipe_categories SET color = ? WHERE name = ?',
      color,
      name,
    )
  } catch (e) {
    console.error('[categories] updateRecipeCategoryColor failed:', e)
    throw e
  }
}

export async function updateIngredientCategoryColor(
  name: string,
  color: string,
): Promise<void> {
  try {
    const db = await getDB()
    await db.runAsync(
      'UPDATE ingredient_categories SET color = ? WHERE name = ?',
      color,
      name,
    )
  } catch (e) {
    console.error('[categories] updateIngredientCategoryColor failed:', e)
    throw e
  }
}

export async function getAllPackageUnits(): Promise<Label[]> {
  try {
    const db = await getDB()
    return await db.getAllAsync<Label>(
      'SELECT name, color FROM package_units ORDER BY name',
    )
  } catch (e) {
    console.error('[categories] getAllPackageUnits failed:', e)
    throw e
  }
}

export async function addPackageUnit(
  name: string,
  color: string = DEFAULT_LABEL_COLOR_KEY,
): Promise<void> {
  try {
    const db = await getDB()
    await db.runAsync(
      'INSERT OR IGNORE INTO package_units (name, color) VALUES (?, ?)',
      name.trim(),
      color,
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

export async function updatePackageUnitColor(
  name: string,
  color: string,
): Promise<void> {
  try {
    const db = await getDB()
    await db.runAsync(
      'UPDATE package_units SET color = ? WHERE name = ?',
      color,
      name,
    )
  } catch (e) {
    console.error('[categories] updatePackageUnitColor failed:', e)
    throw e
  }
}
