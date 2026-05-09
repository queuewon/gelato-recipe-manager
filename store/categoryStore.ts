import { create } from 'zustand'
import {
  getAllRecipeCategories,
  getAllIngredientCategories,
  addRecipeCategory as dbAddRecipe,
  addIngredientCategory as dbAddIngredient,
  deleteRecipeCategory as dbDeleteRecipe,
  deleteIngredientCategory as dbDeleteIngredient,
} from '../db/queries/categories'

interface CategoryState {
  recipeCategories: string[]
  ingredientCategories: string[]
  loadCategories: () => Promise<void>
  addRecipeCategory: (name: string) => Promise<void>
  addIngredientCategory: (name: string) => Promise<void>
  deleteRecipeCategory: (name: string) => Promise<void>
  deleteIngredientCategory: (name: string) => Promise<void>
}

export const useCategoryStore = create<CategoryState>((set) => ({
  recipeCategories: [],
  ingredientCategories: [],

  loadCategories: async (): Promise<void> => {
    try {
      const [recipeCategories, ingredientCategories] = await Promise.all([
        getAllRecipeCategories(),
        getAllIngredientCategories(),
      ])
      set({ recipeCategories, ingredientCategories })
    } catch (e) {
      console.error('[categoryStore] loadCategories failed:', e)
      throw e
    }
  },

  addRecipeCategory: async (name: string): Promise<void> => {
    try {
      await dbAddRecipe(name)
      const recipeCategories = await getAllRecipeCategories()
      set({ recipeCategories })
    } catch (e) {
      console.error('[categoryStore] addRecipeCategory failed:', e)
      throw e
    }
  },

  addIngredientCategory: async (name: string): Promise<void> => {
    try {
      await dbAddIngredient(name)
      const ingredientCategories = await getAllIngredientCategories()
      set({ ingredientCategories })
    } catch (e) {
      console.error('[categoryStore] addIngredientCategory failed:', e)
      throw e
    }
  },

  deleteRecipeCategory: async (name: string): Promise<void> => {
    try {
      await dbDeleteRecipe(name)
      const recipeCategories = await getAllRecipeCategories()
      set({ recipeCategories })
    } catch (e) {
      console.error('[categoryStore] deleteRecipeCategory failed:', e)
      throw e
    }
  },

  deleteIngredientCategory: async (name: string): Promise<void> => {
    try {
      await dbDeleteIngredient(name)
      const ingredientCategories = await getAllIngredientCategories()
      set({ ingredientCategories })
    } catch (e) {
      console.error('[categoryStore] deleteIngredientCategory failed:', e)
      throw e
    }
  },
}))
