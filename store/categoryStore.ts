import { create } from 'zustand'
import {
  getAllRecipeCategories,
  getAllIngredientCategories,
  getAllPackageUnits,
  addRecipeCategory as dbAddRecipe,
  addIngredientCategory as dbAddIngredient,
  addPackageUnit as dbAddPackageUnit,
  deleteRecipeCategory as dbDeleteRecipe,
  deleteIngredientCategory as dbDeleteIngredient,
  deletePackageUnit as dbDeletePackageUnit,
  updateRecipeCategoryColor as dbUpdateRecipeColor,
  updateIngredientCategoryColor as dbUpdateIngredientColor,
  updatePackageUnitColor as dbUpdatePackageUnitColor,
} from '../db/queries/categories'
import type { Label } from '../types'

interface CategoryState {
  recipeCategories: string[]
  ingredientCategories: string[]
  packageUnits: string[]
  recipeCategoryLabels: Label[]
  ingredientCategoryLabels: Label[]
  packageUnitLabels: Label[]
  labelColors: Record<string, string>
  loadCategories: () => Promise<void>
  addRecipeCategory: (name: string, color?: string) => Promise<void>
  addIngredientCategory: (name: string, color?: string) => Promise<void>
  addPackageUnit: (name: string, color?: string) => Promise<void>
  deleteRecipeCategory: (name: string) => Promise<void>
  deleteIngredientCategory: (name: string) => Promise<void>
  deletePackageUnit: (name: string) => Promise<void>
  updateRecipeCategoryColor: (name: string, color: string) => Promise<void>
  updateIngredientCategoryColor: (name: string, color: string) => Promise<void>
  updatePackageUnitColor: (name: string, color: string) => Promise<void>
}

function buildColorMap(...lists: Label[][]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const list of lists) {
    for (const { name, color } of list) {
      map[name] = color
    }
  }
  return map
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  recipeCategories: [],
  ingredientCategories: [],
  packageUnits: [],
  recipeCategoryLabels: [],
  ingredientCategoryLabels: [],
  packageUnitLabels: [],
  labelColors: {},

  loadCategories: async (): Promise<void> => {
    try {
      const [
        recipeCategoryLabels,
        ingredientCategoryLabels,
        packageUnitLabels,
      ] = await Promise.all([
        getAllRecipeCategories(),
        getAllIngredientCategories(),
        getAllPackageUnits(),
      ])
      set({
        recipeCategoryLabels,
        ingredientCategoryLabels,
        packageUnitLabels,
        recipeCategories: recipeCategoryLabels.map((l) => l.name),
        ingredientCategories: ingredientCategoryLabels.map((l) => l.name),
        packageUnits: packageUnitLabels.map((l) => l.name),
        labelColors: buildColorMap(
          recipeCategoryLabels,
          ingredientCategoryLabels,
          packageUnitLabels,
        ),
      })
    } catch (e) {
      console.error('[categoryStore] loadCategories failed:', e)
      throw e
    }
  },

  addRecipeCategory: async (name: string, color?: string): Promise<void> => {
    try {
      await dbAddRecipe(name, color)
      await get().loadCategories()
    } catch (e) {
      console.error('[categoryStore] addRecipeCategory failed:', e)
      throw e
    }
  },

  addIngredientCategory: async (
    name: string,
    color?: string,
  ): Promise<void> => {
    try {
      await dbAddIngredient(name, color)
      await get().loadCategories()
    } catch (e) {
      console.error('[categoryStore] addIngredientCategory failed:', e)
      throw e
    }
  },

  addPackageUnit: async (name: string, color?: string): Promise<void> => {
    try {
      await dbAddPackageUnit(name, color)
      await get().loadCategories()
    } catch (e) {
      console.error('[categoryStore] addPackageUnit failed:', e)
      throw e
    }
  },

  deleteRecipeCategory: async (name: string): Promise<void> => {
    try {
      await dbDeleteRecipe(name)
      await get().loadCategories()
    } catch (e) {
      console.error('[categoryStore] deleteRecipeCategory failed:', e)
      throw e
    }
  },

  deleteIngredientCategory: async (name: string): Promise<void> => {
    try {
      await dbDeleteIngredient(name)
      await get().loadCategories()
    } catch (e) {
      console.error('[categoryStore] deleteIngredientCategory failed:', e)
      throw e
    }
  },

  deletePackageUnit: async (name: string): Promise<void> => {
    try {
      await dbDeletePackageUnit(name)
      await get().loadCategories()
    } catch (e) {
      console.error('[categoryStore] deletePackageUnit failed:', e)
      throw e
    }
  },

  updateRecipeCategoryColor: async (
    name: string,
    color: string,
  ): Promise<void> => {
    try {
      await dbUpdateRecipeColor(name, color)
      await get().loadCategories()
    } catch (e) {
      console.error('[categoryStore] updateRecipeCategoryColor failed:', e)
      throw e
    }
  },

  updateIngredientCategoryColor: async (
    name: string,
    color: string,
  ): Promise<void> => {
    try {
      await dbUpdateIngredientColor(name, color)
      await get().loadCategories()
    } catch (e) {
      console.error('[categoryStore] updateIngredientCategoryColor failed:', e)
      throw e
    }
  },

  updatePackageUnitColor: async (
    name: string,
    color: string,
  ): Promise<void> => {
    try {
      await dbUpdatePackageUnitColor(name, color)
      await get().loadCategories()
    } catch (e) {
      console.error('[categoryStore] updatePackageUnitColor failed:', e)
      throw e
    }
  },
}))
