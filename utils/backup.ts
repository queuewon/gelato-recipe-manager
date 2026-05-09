import type { SQLiteBindValue } from 'expo-sqlite'
import * as FileSystem from 'expo-file-system/legacy'
import * as Sharing from 'expo-sharing'
import { getDB, seedDefaultCategories } from '../db/schema'

const TABLES = [
  'recipes',
  'recipe_versions',
  'suppliers',
  'ingredients',
  'ingredient_price_history',
  'recipe_ingredients',
  'daily_checklist',
  'recipe_categories',
  'ingredient_categories',
] as const

// Tables allowed to be missing in older backups
const OPTIONAL_TABLES = new Set<string>(['recipe_categories', 'ingredient_categories'])

const DELETE_ORDER = [
  'recipe_versions',
  'recipe_ingredients',
  'daily_checklist',
  'ingredient_price_history',
  'ingredients',
  'suppliers',
  'recipes',
  'recipe_categories',
  'ingredient_categories',
] as const

const RESTORE_ORDER = [
  'recipe_categories',
  'ingredient_categories',
  'recipes',
  'suppliers',
  'ingredients',
  'recipe_versions',
  'ingredient_price_history',
  'recipe_ingredients',
  'daily_checklist',
] as const

interface BackupShape {
  version: 1
  exportedAt: string
  data: Record<string, Record<string, unknown>[]>
}

function timestamp(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  return `${yyyy}${mm}${dd}_${hh}${mi}${ss}`
}

export async function exportBackup(): Promise<void> {
  try {
    const db = await getDB()
    const data: Record<string, Record<string, unknown>[]> = {}
    for (const t of TABLES) {
      data[t] = await db.getAllAsync<Record<string, unknown>>(
        `SELECT * FROM ${t}`,
      )
    }
    const payload: BackupShape = {
      version: 1,
      exportedAt: new Date().toISOString(),
      data,
    }
    const json = JSON.stringify(payload, null, 2)
    const filename = `gelato_backup_${timestamp()}.json`
    const cacheDir = FileSystem.cacheDirectory
    if (!cacheDir) {
      throw new Error('캐시 디렉토리를 찾을 수 없어요')
    }
    const uri = `${cacheDir}${filename}`
    await FileSystem.writeAsStringAsync(uri, json)
    if (!(await Sharing.isAvailableAsync())) {
      throw new Error('이 기기에서는 공유 기능을 사용할 수 없어요')
    }
    await Sharing.shareAsync(uri, {
      mimeType: 'application/json',
      dialogTitle: '백업 파일 공유',
    })
  } catch (e) {
    console.error('[backup] exportBackup failed:', e)
    throw e
  }
}

export async function importBackup(fileUri: string): Promise<void> {
  try {
    const text = await FileSystem.readAsStringAsync(fileUri)
    let parsed: Partial<BackupShape>
    try {
      parsed = JSON.parse(text) as Partial<BackupShape>
    } catch {
      throw new Error('JSON 형식이 올바르지 않아요')
    }
    if (parsed.version !== 1 || !parsed.data) {
      throw new Error('지원하지 않는 백업 파일 형식이에요')
    }
    for (const t of TABLES) {
      if (!OPTIONAL_TABLES.has(t) && !Array.isArray(parsed.data[t])) {
        throw new Error(`백업 파일에 '${t}' 테이블이 없어요`)
      }
    }

    const db = await getDB()
    await db.withTransactionAsync(async () => {
      for (const t of DELETE_ORDER) {
        await db.runAsync(`DELETE FROM ${t}`)
      }
      for (const t of RESTORE_ORDER) {
        const rows = parsed.data?.[t] ?? []
        for (const row of rows) {
          const cols = Object.keys(row)
          if (cols.length === 0) continue
          const placeholders = cols.map(() => '?').join(', ')
          const values: SQLiteBindValue[] = cols.map(
            (c) => row[c] as SQLiteBindValue,
          )
          await db.runAsync(
            `INSERT INTO ${t} (${cols.join(', ')}) VALUES (${placeholders})`,
            values,
          )
        }
      }
    })

    // Re-seed default categories if backup had none (old backup format)
    await seedDefaultCategories(db)
  } catch (e) {
    console.error('[backup] importBackup failed:', e)
    throw e
  }
}

export async function clearAllData(): Promise<void> {
  try {
    const db = await getDB()
    await db.withTransactionAsync(async () => {
      for (const t of DELETE_ORDER) {
        await db.runAsync(`DELETE FROM ${t}`)
      }
    })
    await seedDefaultCategories(db)
  } catch (e) {
    console.error('[backup] clearAllData failed:', e)
    throw e
  }
}
