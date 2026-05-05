import { create } from 'zustand'
import * as checklistDB from '../db/queries/checklist'
import type { ChecklistStatus, DailyChecklist, Recipe } from '../types'

type ChecklistItem = DailyChecklist & { recipe: Recipe }

interface ChecklistState {
  checklist: ChecklistItem[]
  isLoading: boolean
  error: string | null

  loadTodayChecklist: () => Promise<void>
  addItem: (recipeId: number, batchSize: number) => Promise<number>
  updateStatus: (id: number, status: ChecklistStatus) => Promise<void>
  removeItem: (id: number) => Promise<void>
}

function toMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

export const useChecklistStore = create<ChecklistState>()((set) => ({
  checklist: [],
  isLoading: false,
  error: null,

  loadTodayChecklist: async () => {
    set({ isLoading: true, error: null })
    try {
      const checklist = await checklistDB.getTodayChecklist()
      set({ checklist, isLoading: false })
    } catch (e) {
      set({ error: toMessage(e), isLoading: false })
    }
  },

  addItem: async (recipeId, batchSize) => {
    set({ isLoading: true, error: null })
    try {
      const newId = await checklistDB.addChecklistItem(recipeId, batchSize)
      const checklist = await checklistDB.getTodayChecklist()
      set({ checklist, isLoading: false })
      return newId
    } catch (e) {
      set({ error: toMessage(e), isLoading: false })
      throw e
    }
  },

  updateStatus: async (id, status) => {
    set({ error: null })
    try {
      await checklistDB.updateChecklistStatus(id, status)
      const checklist = await checklistDB.getTodayChecklist()
      set({ checklist })
    } catch (e) {
      set({ error: toMessage(e) })
      throw e
    }
  },

  removeItem: async (id) => {
    set({ error: null })
    try {
      await checklistDB.removeChecklistItem(id)
      const checklist = await checklistDB.getTodayChecklist()
      set({ checklist })
    } catch (e) {
      set({ error: toMessage(e) })
      throw e
    }
  },
}))
