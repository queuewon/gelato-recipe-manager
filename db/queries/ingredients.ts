import type { SQLiteBindValue } from 'expo-sqlite'
import { getDB } from '../schema'
import type {
  Ingredient,
  IngredientPriceHistory,
  Supplier,
} from '../../types'

const INGREDIENT_UPDATABLE_COLUMNS = [
  'name',
  'category',
  'package_price',
  'package_amount',
  'stock_count',
  'stock_unit',
  'supplier_id',
] as const

const SUPPLIER_UPDATABLE_COLUMNS = ['name', 'contact', 'memo'] as const

export async function getAllIngredients(): Promise<Ingredient[]> {
  try {
    const db = await getDB()
    return await db.getAllAsync<Ingredient>(
      'SELECT * FROM ingredients ORDER BY name',
    )
  } catch (e) {
    console.error('[ingredients] getAllIngredients failed:', e)
    throw e
  }
}

export async function getIngredientById(
  id: number,
): Promise<
  | (Ingredient & {
      priceHistory: IngredientPriceHistory[]
      supplier?: Supplier
    })
  | null
> {
  try {
    const db = await getDB()
    const ing = await db.getFirstAsync<Ingredient>(
      'SELECT * FROM ingredients WHERE id = ?',
      id,
    )
    if (!ing) return null

    const priceHistory = await db.getAllAsync<IngredientPriceHistory>(
      'SELECT * FROM ingredient_price_history WHERE ingredient_id = ? ORDER BY recorded_at DESC',
      id,
    )

    let supplier: Supplier | undefined
    if (ing.supplier_id !== null && ing.supplier_id !== undefined) {
      const s = await db.getFirstAsync<Supplier>(
        'SELECT * FROM suppliers WHERE id = ?',
        ing.supplier_id,
      )
      if (s) supplier = s
    }

    return { ...ing, priceHistory, supplier }
  } catch (e) {
    console.error('[ingredients] getIngredientById failed:', e)
    throw e
  }
}

export async function createIngredient(
  data: Omit<Ingredient, 'id' | 'created_at' | 'price_per_g'>,
  supplierId?: number,
): Promise<number> {
  try {
    const db = await getDB()
    const pricePerG = data.package_price / data.package_amount
    const finalSupplierId = supplierId ?? data.supplier_id ?? null

    let newId = 0
    await db.withTransactionAsync(async () => {
      const r = await db.runAsync(
        `INSERT INTO ingredients
           (name, category, package_price, package_amount, price_per_g,
            stock_count, stock_unit, supplier_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        data.name,
        data.category,
        data.package_price,
        data.package_amount,
        pricePerG,
        data.stock_count,
        data.stock_unit,
        finalSupplierId,
      )
      newId = r.lastInsertRowId

      await db.runAsync(
        `INSERT INTO ingredient_price_history
           (ingredient_id, package_price, package_amount)
         VALUES (?, ?, ?)`,
        newId,
        data.package_price,
        data.package_amount,
      )
    })
    return newId
  } catch (e) {
    console.error('[ingredients] createIngredient failed:', e)
    throw e
  }
}

export async function updateIngredient(
  id: number,
  data: Partial<Omit<Ingredient, 'price_per_g'>>,
): Promise<void> {
  try {
    const db = await getDB()
    await db.withTransactionAsync(async () => {
      const current = await db.getFirstAsync<Ingredient>(
        'SELECT * FROM ingredients WHERE id = ?',
        id,
      )
      if (!current) throw new Error(`Ingredient ${id} not found`)

      const sets: string[] = []
      const values: SQLiteBindValue[] = []
      for (const col of INGREDIENT_UPDATABLE_COLUMNS) {
        const v = data[col]
        if (v !== undefined) {
          sets.push(`${col} = ?`)
          values.push(v as SQLiteBindValue)
        }
      }

      const newPrice = data.package_price ?? current.package_price
      const newAmount = data.package_amount ?? current.package_amount
      const priceChanged =
        (data.package_price !== undefined &&
          data.package_price !== current.package_price) ||
        (data.package_amount !== undefined &&
          data.package_amount !== current.package_amount)

      if (priceChanged) {
        sets.push('price_per_g = ?')
        values.push(newPrice / newAmount)
      }

      if (sets.length === 0) return

      const updateValues: SQLiteBindValue[] = [...values, id]
      await db.runAsync(
        `UPDATE ingredients SET ${sets.join(', ')} WHERE id = ?`,
        updateValues,
      )

      if (priceChanged) {
        await db.runAsync(
          `INSERT INTO ingredient_price_history
             (ingredient_id, package_price, package_amount)
           VALUES (?, ?, ?)`,
          id,
          newPrice,
          newAmount,
        )
      }
    })
  } catch (e) {
    console.error('[ingredients] updateIngredient failed:', e)
    throw e
  }
}

export async function updateStock(
  id: number,
  stock_count: number,
): Promise<void> {
  try {
    const db = await getDB()
    await db.runAsync(
      'UPDATE ingredients SET stock_count = ? WHERE id = ?',
      stock_count,
      id,
    )
  } catch (e) {
    console.error('[ingredients] updateStock failed:', e)
    throw e
  }
}

export async function getAllSuppliers(): Promise<Supplier[]> {
  try {
    const db = await getDB()
    return await db.getAllAsync<Supplier>(
      'SELECT * FROM suppliers ORDER BY name',
    )
  } catch (e) {
    console.error('[ingredients] getAllSuppliers failed:', e)
    throw e
  }
}

export async function createSupplier(
  data: Omit<Supplier, 'id' | 'created_at'>,
): Promise<number> {
  try {
    const db = await getDB()
    const r = await db.runAsync(
      'INSERT INTO suppliers (name, contact, memo) VALUES (?, ?, ?)',
      data.name,
      data.contact ?? null,
      data.memo ?? null,
    )
    return r.lastInsertRowId
  } catch (e) {
    console.error('[ingredients] createSupplier failed:', e)
    throw e
  }
}

export async function updateSupplier(
  id: number,
  data: Partial<Supplier>,
): Promise<void> {
  try {
    const db = await getDB()
    const sets: string[] = []
    const values: SQLiteBindValue[] = []
    for (const col of SUPPLIER_UPDATABLE_COLUMNS) {
      const v = data[col]
      if (v !== undefined) {
        sets.push(`${col} = ?`)
        values.push(v as SQLiteBindValue)
      }
    }
    if (sets.length === 0) return
    const updateValues: SQLiteBindValue[] = [...values, id]
    await db.runAsync(
      `UPDATE suppliers SET ${sets.join(', ')} WHERE id = ?`,
      updateValues,
    )
  } catch (e) {
    console.error('[ingredients] updateSupplier failed:', e)
    throw e
  }
}
