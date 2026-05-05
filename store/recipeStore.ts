import { create } from 'zustand'
import * as recipesDB from '../db/queries/recipes'
import type {
  Recipe,
  RecipeVersion,
  RecipeWithIngredients,
} from '../types'

interface RecipeIngredientInput {
  ingredient_id: number
  amount: number
}

interface RecipeState {
  recipes: Recipe[]
  selectedRecipe: RecipeWithIngredients | null
  versions: RecipeVersion[]
  isLoading: boolean
  error: string | null

  loadRecipes: () => Promise<void>
  loadRecipeById: (id: number) => Promise<void>
  createRecipe: (
    data: Omit<Recipe, 'id' | 'created_at' | 'updated_at'>,
    ingredients: RecipeIngredientInput[],
  ) => Promise<number>
  updateRecipe: (
    id: number,
    data: Partial<Recipe>,
    ingredients?: RecipeIngredientInput[],
  ) => Promise<void>
  deleteRecipe: (id: number) => Promise<void>
  loadVersions: (recipeId: number) => Promise<void>
  restoreVersion: (versionId: number, recipeId: number) => Promise<void>
}

function toMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

export const useRecipeStore = create<RecipeState>()((set, get) => ({
  recipes: [],
  selectedRecipe: null,
  versions: [],
  isLoading: false,
  error: null,

  loadRecipes: async () => {
    set({ isLoading: true, error: null })
    try {
      const recipes = await recipesDB.getAllRecipes()
      set({ recipes, isLoading: false })
    } catch (e) {
      set({ error: toMessage(e), isLoading: false })
    }
  },

  loadRecipeById: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const selectedRecipe = await recipesDB.getRecipeById(id)
      set({ selectedRecipe, isLoading: false })
    } catch (e) {
      set({ error: toMessage(e), isLoading: false })
    }
  },

  createRecipe: async (data, ingredients) => {
    set({ isLoading: true, error: null })
    try {
      const newId = await recipesDB.createRecipe(data, ingredients)
      const recipes = await recipesDB.getAllRecipes()
      set({ recipes, isLoading: false })
      return newId
    } catch (e) {
      set({ error: toMessage(e), isLoading: false })
      throw e
    }
  },

  updateRecipe: async (id, data, ingredients) => {
    set({ isLoading: true, error: null })
    try {
      await recipesDB.updateRecipe(id, data, ingredients)
      const recipes = await recipesDB.getAllRecipes()
      const current = get().selectedRecipe
      const selectedRecipe =
        current && current.id === id
          ? await recipesDB.getRecipeById(id)
          : current
      set({ recipes, selectedRecipe, isLoading: false })
    } catch (e) {
      set({ error: toMessage(e), isLoading: false })
      throw e
    }
  },

  deleteRecipe: async (id) => {
    set({ isLoading: true, error: null })
    try {
      await recipesDB.softDeleteRecipe(id)
      const recipes = await recipesDB.getAllRecipes()
      const current = get().selectedRecipe
      const selectedRecipe = current && current.id === id ? null : current
      set({ recipes, selectedRecipe, isLoading: false })
    } catch (e) {
      set({ error: toMessage(e), isLoading: false })
      throw e
    }
  },

  loadVersions: async (recipeId) => {
    set({ isLoading: true, error: null })
    try {
      const versions = await recipesDB.getRecipeVersions(recipeId)
      set({ versions, isLoading: false })
    } catch (e) {
      set({ error: toMessage(e), isLoading: false })
    }
  },

  restoreVersion: async (versionId, recipeId) => {
    set({ isLoading: true, error: null })
    try {
      await recipesDB.restoreRecipeVersion(versionId)
      const [recipes, selectedRecipe, versions] = await Promise.all([
        recipesDB.getAllRecipes(),
        recipesDB.getRecipeById(recipeId),
        recipesDB.getRecipeVersions(recipeId),
      ])
      set({ recipes, selectedRecipe, versions, isLoading: false })
    } catch (e) {
      set({ error: toMessage(e), isLoading: false })
      throw e
    }
  },
}))
