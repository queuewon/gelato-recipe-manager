import { getDB } from '../schema'
import type { ChecklistStatus, DailyChecklist, Recipe } from '../../types'

export async function getTodayChecklist(): Promise<
  (DailyChecklist & { recipe: Recipe })[]
> {
  try {
    const db = await getDB()
    const items = await db.getAllAsync<DailyChecklist>(
      "SELECT * FROM daily_checklist WHERE date = date('now', 'localtime') ORDER BY id",
    )
    if (items.length === 0) return []

    const recipeIds = Array.from(new Set(items.map((i) => i.recipe_id)))
    const placeholders = recipeIds.map(() => '?').join(',')
    const recipes = await db.getAllAsync<Recipe>(
      `SELECT * FROM recipes WHERE id IN (${placeholders})`,
      recipeIds,
    )
    const recipeMap = new Map<number, Recipe>(recipes.map((r) => [r.id, r]))

    return items.map((i) => {
      const recipe = recipeMap.get(i.recipe_id)
      if (!recipe) {
        throw new Error(
          `Recipe ${i.recipe_id} not found for checklist item ${i.id}`,
        )
      }
      return { ...i, recipe }
    })
  } catch (e) {
    console.error('[checklist] getTodayChecklist failed:', e)
    throw e
  }
}

export async function addChecklistItem(
  recipeId: number,
  batchSize: number,
): Promise<number> {
  try {
    const db = await getDB()
    const r = await db.runAsync(
      `INSERT INTO daily_checklist (recipe_id, date, batch_size, status)
       VALUES (?, date('now', 'localtime'), ?, 'pending')`,
      recipeId,
      batchSize,
    )
    return r.lastInsertRowId
  } catch (e) {
    console.error('[checklist] addChecklistItem failed:', e)
    throw e
  }
}

export async function updateChecklistStatus(
  id: number,
  status: ChecklistStatus,
): Promise<void> {
  try {
    const db = await getDB()
    if (status === 'done') {
      await db.runAsync(
        "UPDATE daily_checklist SET status = ?, completed_at = datetime('now', 'localtime') WHERE id = ?",
        status,
        id,
      )
    } else {
      await db.runAsync(
        'UPDATE daily_checklist SET status = ?, completed_at = NULL WHERE id = ?',
        status,
        id,
      )
    }
  } catch (e) {
    console.error('[checklist] updateChecklistStatus failed:', e)
    throw e
  }
}

export async function removeChecklistItem(id: number): Promise<void> {
  try {
    const db = await getDB()
    await db.runAsync('DELETE FROM daily_checklist WHERE id = ?', id)
  } catch (e) {
    console.error('[checklist] removeChecklistItem failed:', e)
    throw e
  }
}
