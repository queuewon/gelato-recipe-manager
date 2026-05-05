import { create } from 'zustand'
import * as ingredientsDB from '../db/queries/ingredients'
import type {
  Ingredient,
  IngredientPriceHistory,
  Supplier,
} from '../types'

type IngredientDetail = Ingredient & {
  priceHistory: IngredientPriceHistory[]
  supplier?: Supplier
}

interface IngredientState {
  ingredients: Ingredient[]
  selectedIngredient: IngredientDetail | null
  suppliers: Supplier[]
  isLoading: boolean
  error: string | null

  loadIngredients: () => Promise<void>
  loadIngredientById: (id: number) => Promise<void>
  createIngredient: (
    data: Omit<Ingredient, 'id' | 'created_at' | 'price_per_g'>,
    supplierId?: number,
  ) => Promise<number>
  updateIngredient: (
    id: number,
    data: Partial<Omit<Ingredient, 'price_per_g'>>,
  ) => Promise<void>
  deleteIngredient: (id: number) => Promise<void>
  updateStock: (id: number, stock_count: number) => Promise<void>
  loadSuppliers: () => Promise<void>
  createSupplier: (data: Omit<Supplier, 'id' | 'created_at'>) => Promise<number>
  updateSupplier: (id: number, data: Partial<Supplier>) => Promise<void>
}

function toMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

export const useIngredientStore = create<IngredientState>()((set, get) => ({
  ingredients: [],
  selectedIngredient: null,
  suppliers: [],
  isLoading: false,
  error: null,

  loadIngredients: async () => {
    set({ isLoading: true, error: null })
    try {
      const ingredients = await ingredientsDB.getAllIngredients()
      set({ ingredients, isLoading: false })
    } catch (e) {
      set({ error: toMessage(e), isLoading: false })
    }
  },

  loadIngredientById: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const selectedIngredient = await ingredientsDB.getIngredientById(id)
      set({ selectedIngredient, isLoading: false })
    } catch (e) {
      set({ error: toMessage(e), isLoading: false })
    }
  },

  createIngredient: async (data, supplierId) => {
    set({ isLoading: true, error: null })
    try {
      const newId = await ingredientsDB.createIngredient(data, supplierId)
      const ingredients = await ingredientsDB.getAllIngredients()
      set({ ingredients, isLoading: false })
      return newId
    } catch (e) {
      set({ error: toMessage(e), isLoading: false })
      throw e
    }
  },

  updateIngredient: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      await ingredientsDB.updateIngredient(id, data)
      const ingredients = await ingredientsDB.getAllIngredients()
      const current = get().selectedIngredient
      const selectedIngredient =
        current && current.id === id
          ? await ingredientsDB.getIngredientById(id)
          : current
      set({ ingredients, selectedIngredient, isLoading: false })
    } catch (e) {
      set({ error: toMessage(e), isLoading: false })
      throw e
    }
  },

  deleteIngredient: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await ingredientsDB.deleteIngredient(id)
      const ingredients = await ingredientsDB.getAllIngredients()
      const current = get().selectedIngredient
      const selectedIngredient = current && current.id === id ? null : current
      set({ ingredients, selectedIngredient, isLoading: false })
    } catch (e) {
      set({ error: toMessage(e), isLoading: false })
      throw e
    }
  },

  updateStock: async (id, stock_count) => {
    set({ error: null })
    try {
      await ingredientsDB.updateStock(id, stock_count)
      const ingredients = await ingredientsDB.getAllIngredients()
      const current = get().selectedIngredient
      const selectedIngredient =
        current && current.id === id
          ? { ...current, stock_count }
          : current
      set({ ingredients, selectedIngredient })
    } catch (e) {
      set({ error: toMessage(e) })
      throw e
    }
  },

  loadSuppliers: async () => {
    set({ isLoading: true, error: null })
    try {
      const suppliers = await ingredientsDB.getAllSuppliers()
      set({ suppliers, isLoading: false })
    } catch (e) {
      set({ error: toMessage(e), isLoading: false })
    }
  },

  createSupplier: async (data) => {
    set({ isLoading: true, error: null })
    try {
      const newId = await ingredientsDB.createSupplier(data)
      const suppliers = await ingredientsDB.getAllSuppliers()
      set({ suppliers, isLoading: false })
      return newId
    } catch (e) {
      set({ error: toMessage(e), isLoading: false })
      throw e
    }
  },

  updateSupplier: async (id, data) => {
    set({ isLoading: true, error: null })
    try {
      await ingredientsDB.updateSupplier(id, data)
      const suppliers = await ingredientsDB.getAllSuppliers()
      set({ suppliers, isLoading: false })
    } catch (e) {
      set({ error: toMessage(e), isLoading: false })
      throw e
    }
  },
}))
